import { resolve } from "node:path";

import type { Agent } from "@mastra/core/agent";

import { createAngel } from "./agent/angel.js";
import type { AgentConfig } from "./config.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { CrmRepository } from "./crm/crm.repository.js";
import { buildKnowledge } from "./knowledge/knowledge.js";
import {
	type DealershipPricing,
	dealershipPricing,
} from "./knowledge/pricing.js";
import type { OwnerNotifier } from "./notifications/owner-notifier.js";

export interface AngelRuntime {
	agent: Agent;
	conversation: ConversationService;
	crm: CrmRepository;
	pricing: () => DealershipPricing;
}

/**
 * Wires the CRM, knowledge, pricing, tools, memory and conversation service.
 * Shared by the Nest server, the CLI chat and the eval runner.
 */
export const createRuntime = (
	config: AgentConfig,
	notifier: OwnerNotifier,
	options: { dataDir?: string; now?: () => Date } = {}
): AngelRuntime => {
	// Mastra's model router reads the OpenRouter key from the environment.
	process.env.OPENROUTER_API_KEY = config.OPENROUTER_API_KEY;

	const dataDir = resolve(options.dataDir ?? config.AGENT_DATA_DIR);
	const crm = new CrmRepository(resolve(dataDir, "crm.sqlite"), options.now);
	const pricing = () =>
		dealershipPricing(
			{
				earlyPriceUsd: config.DEALERSHIP_EARLY_PRICE_USD,
				earlySlots: config.DEALERSHIP_EARLY_PRICE_SLOTS,
				earlySlotsUsedOffset: config.DEALERSHIP_EARLY_SLOTS_USED_OFFSET,
				standardPriceUsd: config.DEALERSHIP_STANDARD_PRICE_USD,
			},
			crm.countWonDealerships()
		);
	const agent = createAngel({
		crm,
		demoUrl: config.DEMO_SITE_URL,
		knowledge: buildKnowledge(config.DEMO_SITE_URL),
		memoryUrl: `file:${resolve(dataDir, "memory.db").replace(/\\/g, "/")}`,
		model: config.AGENT_MODEL,
		notifier,
		now: options.now,
		pricing,
		reasoningEffort: config.AGENT_REASONING_EFFORT,
		takeoverHours: config.HUMAN_TAKEOVER_HOURS,
	});
	const conversation = new ConversationService({
		agent,
		crm,
		demoUrl: config.DEMO_SITE_URL,
		maxRepliesPerHour: config.MAX_REPLIES_PER_HOUR,
		notifier,
		now: options.now,
		pricing,
	});
	return { agent, conversation, crm, pricing };
};
