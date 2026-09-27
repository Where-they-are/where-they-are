import { resolve } from "node:path";

import type { Agent } from "@mastra/core/agent";
import { JevClient } from "@where-they-are/jev-router";

import { createAngel } from "./agent/angel.js";
import type { AgentConfig } from "./config.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { CrmRepository } from "./crm/crm.repository.js";
import { buildKnowledge } from "./knowledge/knowledge.js";
import { type SocialMediaOffer, socialMediaOffer } from "./knowledge/offer.js";
import { ModelTranscriber } from "./media/transcriber.js";
import { MetaConversionsClient } from "./meta/conversions.js";
import { MetaReporter } from "./meta/meta-reporter.js";
import type { OwnerNotifier } from "./notifications/owner-notifier.js";
import { ConversationGate } from "./relevance/conversation-gate.js";
import { RelevanceGate } from "./relevance/relevance-gate.js";

/** TypeSafe's Jev decision model on OpenRouter, used for the reply gates. */
const JEV_MODEL = "~typesafe/jev-latest";
const JEV_TIMEOUT_MS = 6000;

export interface AngelRuntime {
	agent: Agent;
	config: AgentConfig;
	conversation: ConversationService;
	crm: CrmRepository;
	meta: MetaReporter;
	offer: () => SocialMediaOffer;
	relevance: RelevanceGate;
}

export interface RuntimeOptions {
	dataDir?: string;
	now?: () => Date;
}

const metaFromConfig = (config: AgentConfig): MetaConversionsClient | null =>
	config.META_DATASET_ID && config.META_CAPI_TOKEN
		? new MetaConversionsClient({
				accessToken: config.META_CAPI_TOKEN,
				datasetId: config.META_DATASET_ID,
				...(config.META_TEST_EVENT_CODE
					? { testEventCode: config.META_TEST_EVENT_CODE }
					: {}),
				...(config.META_WHATSAPP_BUSINESS_ACCOUNT_ID
					? {
							whatsappBusinessAccountId:
								config.META_WHATSAPP_BUSINESS_ACCOUNT_ID,
						}
					: {}),
			})
		: null;

/**
 * Wires the CRM, offer, Meta reporting, tools, memory, relevance gate,
 * transcription and conversation service. Shared by the Nest server, the CLI
 * chat and the eval runners.
 */
export const createRuntime = (
	config: AgentConfig,
	notifier: OwnerNotifier,
	options: RuntimeOptions = {}
): AngelRuntime => {
	// Mastra's model router reads the OpenRouter key from the environment.
	process.env.OPENROUTER_API_KEY = config.OPENROUTER_API_KEY;

	const dataDir = resolve(options.dataDir ?? config.AGENT_DATA_DIR);
	const crm = new CrmRepository(resolve(dataDir, "crm.sqlite"), options.now);
	const offer = () =>
		socialMediaOffer(
			{
				launchPlaces: config.LAUNCH_OFFER_PLACES,
				launchPlacesUsedOffset: config.LAUNCH_PLACES_USED_OFFSET,
			},
			crm.countLaunchClients()
		);
	const meta = new MetaReporter(metaFromConfig(config), crm, options.now);
	const agent = createAngel({
		crm,
		examplesUrl: config.EXAMPLES_URL,
		knowledge: buildKnowledge(),
		memoryUrl: `file:${resolve(dataDir, "memory.db").replace(/\\/g, "/")}`,
		meta,
		model: config.AGENT_MODEL,
		notifier,
		now: options.now,
		offer,
		reasoningEffort: config.AGENT_REASONING_EFFORT,
		takeoverHours: config.HUMAN_TAKEOVER_HOURS,
	});
	const jev = new JevClient({
		apiKey: config.OPENROUTER_API_KEY,
		model: JEV_MODEL,
		siteName: "Where They Are Angel",
		timeoutMs: JEV_TIMEOUT_MS,
	});
	const relevance = new RelevanceGate(jev);
	const conversationGate = new ConversationGate(jev);
	const transcriber = new ModelTranscriber({
		model: config.AGENT_MODEL,
		reasoningEffort: config.AGENT_REASONING_EFFORT,
	});
	const conversation = new ConversationService({
		agent,
		conversationGate,
		crm,
		examplesUrl: config.EXAMPLES_URL,
		maxRepliesPerHour: config.MAX_REPLIES_PER_HOUR,
		notifier,
		now: options.now,
		offer,
		relevance,
		transcriber,
	});
	return { agent, config, conversation, crm, meta, offer, relevance };
};
