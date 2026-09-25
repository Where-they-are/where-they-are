import {
	Inject,
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import whatsappWeb, { type Message } from "whatsapp-web.js";

import { AGENT_CONFIG, type AgentConfig } from "../config.js";
import type { IncomingMessage } from "../conversation/conversation.service.js";
import { typingDelayMs } from "../conversation/reply-format.js";
import type { AdSource } from "../crm/crm.types.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import {
	isOwnerCommand,
	OWNER_HELP,
	runOwnerCommand,
} from "../owner/owner-commands.js";
import { normalizePhone, phoneFromChatId } from "../owner/phone.js";
import type { CustomerMessenger } from "../payments/payment.service.js";
import type { AngelRuntime } from "../runtime.js";
import { EchoTracker, MessageBatcher } from "./message-batcher.js";
import {
	adSourceFrom,
	isIgnoredChat,
	isIgnoredType,
	toIncomingMessage,
} from "./normalize.js";

const { Client, LocalAuth } = whatsappWeb;

export type WhatsAppState =
	| "disabled"
	| "starting"
	| "waiting_for_link"
	| "authenticated"
	| "ready"
	| "disconnected"
	| "failed";

interface QueuedMessage {
	adSource: AdSource | null;
	displayName: string | null;
	message: IncomingMessage;
	phone: string;
}

const HOUR_MS = 60 * 60 * 1000;
const RESTART_DELAY_MS = 15_000;
const MAX_RESTART_DELAY_MS = 5 * 60 * 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Angel's WhatsApp Web session. Routes customer messages to the conversation
 * service, owner messages to owner commands, notices when a person replies
 * by hand, and delivers owner alerts.
 */
@Injectable()
export class WhatsAppService
	implements OnModuleInit, OnModuleDestroy, OwnerNotifier, CustomerMessenger
{
	private readonly logger = new Logger("WhatsApp");
	private readonly config: AgentConfig;
	private readonly echoes = new EchoTracker();
	private readonly batcher: MessageBatcher<QueuedMessage>;
	private client: InstanceType<typeof Client> | undefined;
	private runtime: AngelRuntime | undefined;
	private readonly pendingAlerts: string[] = [];
	private restartDelay = RESTART_DELAY_MS;
	private restartTimer: ReturnType<typeof setTimeout> | undefined;
	private stopping = false;

	state: WhatsAppState = "disabled";
	qr: string | null = null;
	pairingCode: string | null = null;
	lastError: string | null = null;
	readySince: string | null = null;

	constructor(@Inject(AGENT_CONFIG) config: AgentConfig) {
		this.config = config;
		this.batcher = new MessageBatcher(
			config.REPLY_DEBOUNCE_MS,
			(chatId, items) => {
				this.respond(chatId, items).catch((error: unknown) =>
					this.logger.error(`Reply to ${chatId} failed: ${String(error)}`)
				);
			}
		);
	}

	attach(runtime: AngelRuntime): void {
		this.runtime = runtime;
		runtime.payments.attachMessenger(this);
	}

	/** Messages a customer outside a reply turn, e.g. a payment confirmation. */
	async sendToCustomer(chatId: string, text: string): Promise<void> {
		if (!this.client || this.state !== "ready") {
			throw new Error("WhatsApp is not connected");
		}
		await this.send(chatId, [text], false);
	}

	onModuleInit(): void {
		if (!this.config.WHATSAPP_ENABLED) {
			this.logger.warn(
				"WHATSAPP_ENABLED=false: running without a WhatsApp session"
			);
			return;
		}
		this.start();
	}

	async onModuleDestroy(): Promise<void> {
		this.stopping = true;
		this.batcher.clear();
		clearTimeout(this.restartTimer);
		await this.client?.destroy().catch(() => undefined);
	}

	status() {
		return {
			lastError: this.lastError,
			pairingCode: this.pairingCode,
			qr: this.qr,
			readySince: this.readySince,
			state: this.state,
		};
	}

	/** Sends an alert to the owner, or holds it until the session is ready. */
	async notifyOwner(text: string): Promise<void> {
		if (!this.client || this.state !== "ready") {
			this.pendingAlerts.push(text);
			this.logger.warn(`Owner alert queued until WhatsApp is ready:\n${text}`);
			return;
		}
		const ownerId = await this.client.getNumberId(
			this.config.OWNER_WHATSAPP_NUMBER
		);
		if (!ownerId) {
			throw new Error("The owner's number is not on WhatsApp");
		}
		await this.client.sendMessage(ownerId._serialized, text);
	}

	private start(): void {
		this.state = "starting";
		const pairingNumber = this.config.WHATSAPP_PAIRING_NUMBER;
		const client = new Client({
			authStrategy: new LocalAuth({
				clientId: this.config.WHATSAPP_CLIENT_ID,
				dataPath: this.config.WHATSAPP_AUTH_PATH,
			}),
			...(pairingNumber
				? {
						pairWithPhoneNumber: {
							phoneNumber: pairingNumber,
							showNotification: true,
						},
					}
				: {}),
			puppeteer: {
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-gpu",
				],
				headless: true,
				...(this.config.CHROME_EXECUTABLE_PATH
					? { executablePath: this.config.CHROME_EXECUTABLE_PATH }
					: {}),
			},
		});
		this.client = client;

		client.on("qr", (qr: string) => {
			this.state = "waiting_for_link";
			this.qr = qr;
			this.logger.log(
				pairingNumber
					? "Waiting for the pairing code to be entered on the phone"
					: "Waiting for a link: set WHATSAPP_PAIRING_NUMBER for an 8-character pairing code, or read the QR string from GET /api/admin/whatsapp"
			);
		});
		client.on("code", (code: string) => {
			this.state = "waiting_for_link";
			this.pairingCode = code;
			this.logger.log(
				`Pairing code: ${code}. On the business phone: WhatsApp > Linked devices > Link with phone number.`
			);
		});
		client.on("authenticated", () => {
			this.state = "authenticated";
			this.qr = null;
			this.pairingCode = null;
		});
		client.on("auth_failure", (message: string) => {
			this.state = "failed";
			this.lastError = `Authentication failed: ${message}`;
			this.logger.error(this.lastError);
		});
		client.on("ready", () => {
			this.state = "ready";
			this.readySince = new Date().toISOString();
			this.restartDelay = RESTART_DELAY_MS;
			this.logger.log("WhatsApp is ready: Angel is live");
			this.flushPendingAlerts().catch(() => undefined);
		});
		client.on("disconnected", (reason: string) => {
			this.state = "disconnected";
			this.lastError = `Disconnected: ${reason}`;
			this.logger.warn(this.lastError);
			this.scheduleRestart();
		});
		client.on("message", (message: Message) => {
			this.onIncoming(message).catch((error: unknown) =>
				this.logger.error(`Incoming message failed: ${String(error)}`)
			);
		});
		client.on("message_create", (message: Message) => {
			this.onCreated(message).catch((error: unknown) =>
				this.logger.error(`Outgoing message check failed: ${String(error)}`)
			);
		});

		client.initialize().catch((error: unknown) => {
			this.state = "failed";
			this.lastError = `Could not start WhatsApp Web: ${String(error)}`;
			this.logger.error(this.lastError);
			this.scheduleRestart();
		});
	}

	private scheduleRestart(): void {
		// biome-ignore lint/suspicious/noUnnecessaryConditions: set by onModuleDestroy during shutdown
		if (this.stopping) {
			return;
		}
		clearTimeout(this.restartTimer);
		const delay = this.restartDelay;
		this.restartDelay = Math.min(this.restartDelay * 2, MAX_RESTART_DELAY_MS);
		this.logger.warn(`Restarting WhatsApp in ${Math.round(delay / 1000)}s`);
		this.restartTimer = setTimeout(() => {
			const previous = this.client;
			this.client = undefined;
			(previous?.destroy() ?? Promise.resolve())
				.catch(() => undefined)
				.finally(() => this.start());
		}, delay);
	}

	private async flushPendingAlerts(): Promise<void> {
		while (this.pendingAlerts.length > 0) {
			const alert = this.pendingAlerts.shift();
			if (alert) {
				// biome-ignore lint/performance/noAwaitInLoops: alerts go out in order
				await this.notifyOwner(alert);
			}
		}
	}

	/** Resolves a chat to a phone number, including WhatsApp's newer @lid ids. */
	private async phoneFor(chatId: string): Promise<string> {
		const direct = phoneFromChatId(chatId);
		if (direct) {
			return direct;
		}
		try {
			const [mapping] =
				(await this.client?.getContactLidAndPhone([chatId])) ?? [];
			const phone = mapping?.pn
				? (phoneFromChatId(mapping.pn) ?? normalizePhone(mapping.pn))
				: "";
			if (phone) {
				return phone;
			}
		} catch {
			// Fall back to the chat id's digits below.
		}
		return normalizePhone(chatId.split("@")[0] ?? chatId);
	}

	private async onIncoming(message: Message): Promise<void> {
		if (
			message.fromMe ||
			isIgnoredChat(message.from) ||
			isIgnoredType(message.type)
		) {
			return;
		}
		const phone = await this.phoneFor(message.from);
		if (phone === this.config.OWNER_WHATSAPP_NUMBER) {
			await this.handleOwner(message);
			return;
		}
		const incoming = await toIncomingMessage(message);
		const displayName =
			(message as unknown as { _data?: { notifyName?: string } })._data
				?.notifyName ?? null;
		this.batcher.add(message.from, {
			adSource: adSourceFrom(message),
			displayName,
			message: incoming,
			phone,
		});
	}

	private async handleOwner(message: Message): Promise<void> {
		if (!this.runtime) {
			return;
		}
		const text = message.body;
		const reply = isOwnerCommand(text)
			? await runOwnerCommand(text, {
					crm: this.runtime.crm,
					payments: this.runtime.payments,
					pricing: this.runtime.pricing,
					takeoverHours: this.config.HUMAN_TAKEOVER_HOURS,
				})
			: `Hi! I'm Angel. You're the owner, so I won't treat you as a lead.\n\n${OWNER_HELP}`;
		await this.send(message.from, [reply], false);
	}

	/**
	 * A message sent from the business number that Angel did not send was
	 * typed by a person: Angel steps back in that chat for a while.
	 */
	private async onCreated(message: Message): Promise<void> {
		if (!(message.fromMe && this.runtime) || isIgnoredChat(message.to)) {
			return;
		}
		if (this.echoes.consume(message.to, message.body)) {
			return;
		}
		const phone = await this.phoneFor(message.to);
		if (phone === this.config.OWNER_WHATSAPP_NUMBER) {
			return;
		}
		const { crm } = this.runtime;
		if (!crm.get(phone)) {
			crm.touchInbound({
				chatId: message.to,
				id: phone,
				text: "(conversation started by the team)",
			});
		}
		crm.logMessage(phone, "owner", message.body || `(${message.type})`);
		crm.setHumanTakeover(
			phone,
			new Date(Date.now() + this.config.HUMAN_TAKEOVER_HOURS * HOUR_MS),
			"owner_reply"
		);
		this.logger.log(
			`A person replied in ${phone}: Angel paused there for ${this.config.HUMAN_TAKEOVER_HOURS}h`
		);
	}

	private async respond(chatId: string, items: QueuedMessage[]): Promise<void> {
		const [first] = items;
		if (!(this.runtime && first)) {
			return;
		}
		const result = await this.runtime.conversation.handle({
			chatId,
			customerId: first.phone,
			displayName:
				items.findLast((item) => item.displayName)?.displayName ?? null,
			messages: items.map((item) => item.message),
		});
		const adSource = items.find((item) => item.adSource)?.adSource;
		if (adSource && this.runtime.crm.get(first.phone)) {
			this.runtime.crm.setAdSource(first.phone, adSource);
		}
		await this.send(chatId, result.replies, true);
	}

	private async send(
		chatId: string,
		replies: string[],
		humanPacing: boolean
	): Promise<void> {
		if (!this.client || replies.length === 0) {
			return;
		}
		const chat = await this.client.getChatById(chatId);
		await chat.sendSeen().catch(() => undefined);
		for (const reply of replies) {
			if (humanPacing) {
				// biome-ignore lint/performance/noAwaitInLoops: bubbles are typed one after another
				await chat.sendStateTyping().catch(() => undefined);
				await sleep(typingDelayMs(reply));
			}
			this.echoes.remember(chatId, reply);
			await this.client.sendMessage(chatId, reply);
		}
		await chat.clearState().catch(() => undefined);
	}
}
