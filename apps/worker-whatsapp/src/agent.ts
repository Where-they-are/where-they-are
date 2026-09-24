import { Agent } from "@mastra/core/agent";
import { buildIntakeMessage } from "./ai-input.js";
import type { WorkerConfig } from "./config.js";
import {
	type NormalizedMessage,
	type SiteIntake,
	siteIntakeSchema,
} from "./types.js";

const instructions = [
	"You are the Where They Are customer-intake agent for Zimbabwean businesses.",
	"Your job is to turn one WhatsApp message into a structured website brief update.",
	"Do not create prices, testimonials, addresses, credentials, services, or other facts.",
	"If a value is not explicitly supplied, return null or include the field in missingFields.",
	"Keep suggestedReply in plain, concise English suitable for WhatsApp.",
].join(" ");

export const createSiteIntakeAgent = (config: WorkerConfig): Agent =>
	new Agent({
		id: "where-they-are-site-intake",
		instructions,
		model: `openrouter/${config.OPENROUTER_MODEL}`,
		name: "Where They Are Site Intake",
	});

export const extractSiteIntake = async (
	agent: Agent,
	message: NormalizedMessage
): Promise<SiteIntake> => {
	const response = await agent.generate([buildIntakeMessage(message)], {
		maxSteps: 1,
		modelSettings: {
			maxOutputTokens: 900,
			temperature: 0.2,
		},
		structuredOutput: {
			jsonPromptInjection: "auto",
			schema: siteIntakeSchema,
		},
	});

	if (!response.object) {
		throw new Error("Mastra returned no structured site-intake object");
	}

	return siteIntakeSchema.parse(response.object);
};
