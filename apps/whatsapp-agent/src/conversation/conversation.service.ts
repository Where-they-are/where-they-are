import type { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";

import { TURN_CONTEXT_KEY } from "../agent/angel.js";
import type { TurnContext } from "../agent/instructions.js";
import { CUSTOMER_ID_KEY, IGNORED_KEY } from "../agent/tools.js";
import type { CrmRepository } from "../crm/crm.repository.js";
import type { Customer, IgnoreCategory } from "../crm/crm.types.js";
import type { DealershipPricing } from "../knowledge/pricing.js";
import type { Transcriber } from "../media/transcriber.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import type { RelevanceGate } from "../relevance/relevance-gate.js";
import {
	FALLBACK_REPLY,
	isOptIn,
	isOptOut,
	OPT_IN_REPLY,
	OPT_OUT_REPLY,
	RATE_LIMITED_REPLY,
	UNSUPPORTED_MEDIA_REPLY,
} from "./intents.js";
import { splitIntoBubbles } from "./reply-format.js";

export type MediaKind = "image" | "audio" | "document" | "other";

export interface IncomingMessage {
	media?: { base64: string; filename?: string; mimeType: string };
	mediaKind?: MediaKind;
	text: string;
}

export interface IncomingBatch {
	chatId: string;
	customerId: string;
	displayName?: string | null;
	messages: IncomingMessage[];
}

export type TurnOutcome =
	| "replied"
	| "opted_out"
	| "opted_in"
	| "silent_opted_out"
	| "human_active"
	| "rate_limited"
	| "ignored"
	| "fallback";

export interface TurnResult {
	outcome: TurnOutcome;
	replies: string[];
}

const HOUR_MS = 60 * 60 * 1000;
const RETRY_DELAY_MS = 1500;
const TRANSIENT_ERROR =
	/thought signature|reasoning details|provider returned error|timeout|timed out|aborted|ECONNRESET|fetch failed|\b(429|500|502|503|504)\b|overloaded|rate limit/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const errorText = (error: unknown): string => {
	if (!(error instanceof Error)) {
		return String(error);
	}
	const body = (error as { responseBody?: unknown }).responseBody;
	return `${error.message} ${typeof body === "string" ? body : ""}`;
};

/** Upstream failures worth one retry, as opposed to bugs or bad input. */
export const isTransientModelError = (error: unknown): boolean =>
	TRANSIENT_ERROR.test(errorText(error));
/** Base64 length of roughly 12 MB of media. */
const MAX_MEDIA_BASE64 = 16_000_000;
const MAX_STEPS = 8;
const SUPPORTED_MEDIA = /^(image\/(jpeg|png|webp)|audio\/|application\/pdf)/;

type ContentPart =
	| { text: string; type: "text" }
	| { image: string; mimeType: string; type: "image" }
	| { data: string; mimeType: string; type: "file" };

const harareTime = (date: Date): string =>
	new Intl.DateTimeFormat("en-GB", {
		dateStyle: "full",
		timeStyle: "short",
		timeZone: "Africa/Harare",
	}).format(date);

const describeMediaForLog = (message: IncomingMessage): string =>
	message.mediaKind
		? `[${message.mediaKind}] ${message.text}`.trim()
		: message.text;

export interface ConversationDeps {
	agent: Agent;
	crm: CrmRepository;
	demoUrl: string;
	maxRepliesPerHour: number;
	notifier: OwnerNotifier;
	now?: () => Date;
	pricing: () => DealershipPricing;
	/** Jev check that keeps Angel quiet for spam, personal messages and wrong numbers. */
	relevance?: RelevanceGate;
	/** Turns voice notes into text before anything else sees them. */
	transcriber?: Transcriber;
}

/**
 * Turns a batch of customer messages into Angel's replies. Transport-agnostic:
 * WhatsApp, the CLI chat and the eval runner all go through here.
 */
export class ConversationService {
	private readonly queues = new Map<string, Promise<unknown>>();
	private readonly now: () => Date;
	private readonly lastErrorAlert = new Map<string, number>();
	private readonly deps: ConversationDeps;

	constructor(deps: ConversationDeps) {
		this.deps = deps;
		this.now = deps.now ?? (() => new Date());
	}

	/** Runs turns for the same customer one at a time, in arrival order. */
	handle(batch: IncomingBatch): Promise<TurnResult> {
		const previous = this.queues.get(batch.customerId) ?? Promise.resolve();
		const next = previous.catch(() => undefined).then(() => this.run(batch));
		this.queues.set(batch.customerId, next);
		next
			.finally(() => {
				if (this.queues.get(batch.customerId) === next) {
					this.queues.delete(batch.customerId);
				}
			})
			.catch(() => undefined);
		return next;
	}

	private async run(batch: IncomingBatch): Promise<TurnResult> {
		const { crm } = this.deps;
		const messages = await this.transcribeVoiceNotes(batch.messages);
		const combinedText = messages
			.map((message) => message.text)
			.filter(Boolean)
			.join("\n");
		const ignored = await this.checkRelevance(batch, messages, combinedText);
		if (ignored) {
			return ignored;
		}
		const { created, customer } = crm.touchInbound({
			chatId: batch.chatId,
			displayName: batch.displayName ?? null,
			id: batch.customerId,
			text: combinedText || `[${messages[0]?.mediaKind ?? "message"}]`,
		});
		for (const message of messages) {
			crm.logMessage(
				customer.id,
				"in",
				describeMediaForLog(message),
				message.mediaKind ?? null
			);
		}

		const stopped = await this.guard(customer, combinedText);
		if (stopped) {
			return stopped;
		}

		const content = this.buildContent(messages);
		if (content === null) {
			return this.reply(customer.id, "replied", [UNSUPPORTED_MEDIA_REPLY]);
		}

		try {
			const { ignoredAs, text } = await this.generate(
				customer,
				created,
				content
			);
			if (ignoredAs) {
				crm.recordEvent(customer.id, "ignored", {
					by: "angel",
					category: ignoredAs,
				});
				return { outcome: "ignored", replies: [] };
			}
			const replies = splitIntoBubbles(text);
			if (replies.length === 0) {
				throw new Error("Angel returned an empty reply");
			}
			return this.reply(customer.id, "replied", replies);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			crm.recordEvent(customer.id, "agent_error", { message });
			await this.alertOwner(
				customer,
				`⚠️ Angel hit an error replying to ${customer.displayName ?? customer.id} and sent a holding message. Please check the chat: https://wa.me/${customer.id}\nError: ${message.slice(0, 200)}`
			);
			return this.reply(customer.id, "fallback", [FALLBACK_REPLY]);
		}
	}

	/** Opt-outs, human takeover and rate limits that stop Angel before the model runs. */
	private async guard(
		customer: Customer,
		combinedText: string
	): Promise<TurnResult | null> {
		const { crm } = this.deps;
		if (customer.optedOut) {
			if (isOptIn(combinedText)) {
				crm.setOptedOut(customer.id, false);
				return this.reply(customer.id, "opted_in", [OPT_IN_REPLY]);
			}
			return { outcome: "silent_opted_out", replies: [] };
		}
		if (isOptOut(combinedText)) {
			crm.setOptedOut(customer.id, true);
			return this.reply(customer.id, "opted_out", [OPT_OUT_REPLY]);
		}
		if (crm.isHumanActive(customer)) {
			return { outcome: "human_active", replies: [] };
		}
		if (
			crm.countRecentReplies(customer.id, HOUR_MS) >=
			this.deps.maxRepliesPerHour
		) {
			crm.recordEvent(customer.id, "rate_limited", {});
			const alreadyWarned = crm
				.events(customer.id, 5)
				.filter((event) => event.type === "rate_limited").length;
			if (alreadyWarned > 1) {
				return { outcome: "rate_limited", replies: [] };
			}
			await this.alertOwner(
				customer,
				`⚠️ Angel paused replies to ${customer.displayName ?? customer.id} after ${this.deps.maxRepliesPerHour} replies in an hour. Chat: https://wa.me/${customer.id}`
			);
			return this.reply(customer.id, "rate_limited", [RATE_LIMITED_REPLY]);
		}
		return null;
	}

	/** Replaces voice notes with their transcript so every later step sees text. */
	private async transcribeVoiceNotes(
		messages: IncomingMessage[]
	): Promise<IncomingMessage[]> {
		const { transcriber } = this.deps;
		if (!transcriber) {
			return messages;
		}
		return await Promise.all(
			messages.map(async (message) => {
				if (message.mediaKind !== "audio" || !message.media) {
					return message;
				}
				const transcript = await transcriber.transcribe(message.media);
				if (!transcript) {
					return message;
				}
				const caption = message.text ? `${message.text}\n` : "";
				return {
					mediaKind: "audio" as const,
					text: `${caption}(Voice note) ${transcript}`,
				};
			})
		);
	}

	/**
	 * Runs the Jev relevance gate for new and previously ignored contacts.
	 * Returns a silent result when the messages should be ignored.
	 */
	private async checkRelevance(
		batch: IncomingBatch,
		messages: IncomingMessage[],
		combinedText: string
	): Promise<TurnResult | null> {
		const { crm, relevance } = this.deps;
		const existing = crm.get(batch.customerId);
		const previous = crm.getIgnored(batch.customerId);
		const allowed = previous?.allowed ?? false;
		const needsCheck = !allowed && (!existing || previous !== undefined);
		if (!(relevance && needsCheck)) {
			return null;
		}
		const decision = await relevance.decide({
			contact: {
				displayName: batch.displayName ?? null,
				firstContact: !existing,
				previouslyIgnoredAs: previous?.category ?? null,
			},
			messages: messages.map(
				(message) =>
					describeMediaForLog(message) || `[${message.mediaKind ?? "message"}]`
			),
		});
		if (decision.verdict === "ignore") {
			crm.recordIgnored({
				category: decision.category as IgnoreCategory,
				chatId: batch.chatId,
				confidence: decision.confidence,
				displayName: batch.displayName ?? null,
				id: batch.customerId,
				text: combinedText || "[media]",
			});
			return { outcome: "ignored", replies: [] };
		}
		if (previous) {
			crm.clearIgnored(batch.customerId);
		}
		return null;
	}

	private reply(
		customerId: string,
		outcome: TurnOutcome,
		replies: string[]
	): TurnResult {
		for (const text of replies) {
			this.deps.crm.logMessage(customerId, "out", text);
		}
		this.deps.crm.touchOutbound(customerId);
		return { outcome, replies };
	}

	private buildContent(messages: IncomingMessage[]): ContentPart[] | null {
		const parts: ContentPart[] = [];
		let unsupported = 0;
		for (const message of messages) {
			if (message.text) {
				parts.push({ text: message.text, type: "text" });
			}
			const { media } = message;
			if (!media) {
				continue;
			}
			if (
				!SUPPORTED_MEDIA.test(media.mimeType) ||
				media.base64.length > MAX_MEDIA_BASE64
			) {
				unsupported += 1;
				continue;
			}
			const dataUri = `data:${media.mimeType};base64,${media.base64}`;
			if (message.mediaKind === "image") {
				parts.push({ image: dataUri, mimeType: media.mimeType, type: "image" });
				if (!message.text) {
					parts.push({
						text: "(The customer sent this image without a caption.)",
						type: "text",
					});
				}
			} else {
				parts.push({ data: dataUri, mimeType: media.mimeType, type: "file" });
				if (message.mediaKind === "audio") {
					parts.push({
						text: "(The customer sent a voice note. Listen to it and reply to what they said.)",
						type: "text",
					});
				}
			}
		}
		if (parts.length === 0) {
			return unsupported > 0
				? null
				: [{ text: "(empty message)", type: "text" }];
		}
		return parts;
	}

	/** Messages from a human team member since Angel last spoke, if any. */
	private humanTranscript(customerId: string): string | null {
		const recent = this.deps.crm.messages(customerId, 40);
		const lastAngel = recent.findLastIndex(
			(message) => message.direction === "out"
		);
		const window = recent.slice(lastAngel + 1);
		if (!window.some((message) => message.direction === "owner")) {
			return null;
		}
		return window
			.map(
				(message) =>
					`${message.direction === "owner" ? "Team member" : "Customer"}: ${message.body}`
			)
			.join("\n");
	}

	private async generate(
		customer: Customer,
		isFirstContact: boolean,
		content: ContentPart[]
	): Promise<{ ignoredAs: IgnoreCategory | null; text: string }> {
		const turn: TurnContext = {
			customer,
			demoUrl: this.deps.demoUrl,
			humanHandledTranscript: this.humanTranscript(customer.id),
			isFirstContact,
			nowInHarare: harareTime(this.now()),
			pricing: this.deps.pricing(),
		};
		const requestContext = new RequestContext();
		requestContext.set(CUSTOMER_ID_KEY, customer.id);
		requestContext.set(TURN_CONTEXT_KEY, turn);

		// The agent's model list already retries and falls back to a second
		// provider; reasoning settings live on each model entry.
		const run = () =>
			this.deps.agent.generate([{ content, role: "user" }] as never, {
				maxSteps: MAX_STEPS,
				memory: { resource: customer.id, thread: `whatsapp-${customer.id}` },
				modelSettings: { temperature: 0.4 },
				requestContext,
			});
		const finish = (text: string | undefined) => ({
			ignoredAs:
				(requestContext.get(IGNORED_KEY) as IgnoreCategory | undefined) ?? null,
			text: text ?? "",
		});
		try {
			return finish((await run()).text);
		} catch (error) {
			if (!isTransientModelError(error)) {
				throw error;
			}
			// One more attempt after a pause, for brief outages on every model.
			await sleep(RETRY_DELAY_MS);
			return finish((await run()).text);
		}
	}

	private async alertOwner(customer: Customer, message: string): Promise<void> {
		const at = this.now().getTime();
		const last = this.lastErrorAlert.get(customer.id) ?? 0;
		if (at - last < HOUR_MS / 2) {
			return;
		}
		this.lastErrorAlert.set(customer.id, at);
		try {
			await this.deps.notifier.notifyOwner(message);
		} catch {
			// Alerts are best effort; the CRM keeps the event.
		}
	}
}
