import {
	type JevClient,
	preflightWhatsAppMessage,
} from "@where-they-are/jev-router";
import { Client, LocalAuth, type Message } from "whatsapp-web.js";
import { extractSiteIntake } from "./agent.js";
import type { WorkerConfig } from "./config.js";
import { normalizeMessage } from "./normalize-message.js";
import type { SiteIntake } from "./types.js";

export type IntakeResultHandler = (input: {
	messageId: string;
	chatId: string;
	intake: SiteIntake;
}) => Promise<void>;

export const createWhatsAppClient = (
	config: WorkerConfig,
	agent: Parameters<typeof extractSiteIntake>[0],
	jevClient: JevClient | undefined,
	onIntake: IntakeResultHandler
): Client => {
	const client = new Client({
		authStrategy: new LocalAuth({
			clientId: config.WHATSAPP_CLIENT_ID,
			dataPath: config.WHATSAPP_AUTH_PATH,
		}),
		puppeteer: {
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			...(config.CHROME_EXECUTABLE_PATH
				? { executablePath: config.CHROME_EXECUTABLE_PATH }
				: {}),
		},
	});

	client.on("ready", () => {
		console.info("WhatsApp client is ready");
	});

	client.on("auth_failure", (message) => {
		console.error(`WhatsApp authentication failed: ${message}`);
	});

	client.on("disconnected", (reason) => {
		console.warn(`WhatsApp client disconnected: ${reason}`);
	});

	client.on("message", async (message: Message) => {
		try {
			const normalized = await normalizeMessage(message);
			const preflight = await preflightWhatsAppMessage(jevClient, normalized, {
				enabled: config.JEV_ENABLED,
				failOpen: config.JEV_FAIL_OPEN,
				minConfidence: config.JEV_MIN_CONFIDENCE,
			});

			if (!preflight.allowed) {
				const replies = {
					chitchat:
						"I’m here to help you create a modern business website. Send your business details or ask me about our plans.",
					sales:
						"I can help you choose a plan. Please tell me your business type and whether you need a Starter, Growth, or Premium website.",
					"site-intake":
						"Please send your business details and I’ll help prepare the website brief.",
					support:
						"I can help with an existing site, payment, hosting, domain, preview, or technical question. Please describe what you need help with.",
					unsupported:
						"That request is outside the current brochure-website service. I can help with a modern business website, content, preview, hosting, domain, or contact details.",
				} as const;
				await message.reply(replies[preflight.route]);
				return;
			}

			const intake = await extractSiteIntake(agent, normalized);

			await onIntake({
				chatId: normalized.chatId,
				intake,
				messageId: normalized.id,
			});

			await message.reply(intake.suggestedReply);
		} catch (error) {
			console.error("WhatsApp message processing failed", error);
			await message.reply(
				"Thanks — I could not process that message just yet. Please try sending it again."
			);
		}
	});

	return client;
};
