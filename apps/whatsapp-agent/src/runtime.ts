import { resolve } from "node:path";

import type { Agent } from "@mastra/core/agent";
import { JevClient } from "@where-they-are/jev-router";
import { PaynowClient } from "@where-they-are/paynow";

import { createAngel } from "./agent/angel.js";
import type { AgentConfig } from "./config.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { CrmRepository } from "./crm/crm.repository.js";
import { buildKnowledge } from "./knowledge/knowledge.js";
import {
	type DealershipPricing,
	dealershipPricing,
} from "./knowledge/pricing.js";
import { ModelTranscriber } from "./media/transcriber.js";
import { MetaConversionsClient } from "./meta/conversions.js";
import { MetaReporter } from "./meta/meta-reporter.js";
import type { OwnerNotifier } from "./notifications/owner-notifier.js";
import {
	type PaymentGateway,
	PaymentService,
} from "./payments/payment.service.js";
import { RelevanceGate } from "./relevance/relevance-gate.js";

/** TypeSafe's Jev decision model on OpenRouter, used for the relevance gate. */
const JEV_MODEL = "~typesafe/jev-latest";
const JEV_TIMEOUT_MS = 6000;
/** Paynow POSTs status updates here (see PaynowController). */
export const PAYNOW_RESULT_PATH = "/api/paynow/result";

export interface AngelRuntime {
	agent: Agent;
	config: AgentConfig;
	conversation: ConversationService;
	crm: CrmRepository;
	meta: MetaReporter;
	payments: PaymentService;
	pricing: () => DealershipPricing;
	relevance: RelevanceGate;
}

export interface RuntimeOptions {
	dataDir?: string;
	/** Replaces Paynow, e.g. with a fake in evals and tests. */
	gateway?: PaymentGateway | null;
	now?: () => Date;
}

/** Paynow when all three credentials are set; otherwise payments go to the owner. */
export const paynowFromConfig = (config: AgentConfig): PaynowClient | null => {
	if (
		!(
			config.PAYNOW_INTEGRATION_ID &&
			config.PAYNOW_INTEGRATION_KEY &&
			config.PAYNOW_AUTH_EMAIL
		)
	) {
		return null;
	}
	const base = config.PUBLIC_BASE_URL || new URL(config.DEMO_SITE_URL).origin;
	return new PaynowClient({
		authEmail: config.PAYNOW_AUTH_EMAIL,
		integrationId: config.PAYNOW_INTEGRATION_ID,
		integrationKey: config.PAYNOW_INTEGRATION_KEY,
		resultUrl: `${base}${PAYNOW_RESULT_PATH}`,
		returnUrl: config.DEMO_SITE_URL,
	});
};

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
 * Wires the CRM, offer, payments, Meta reporting, tools, memory, relevance
 * gate, transcription and conversation service. Shared by the Nest server,
 * the CLI chat and the eval runners.
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
	const pricing = () =>
		dealershipPricing(
			{
				earlyPriceUsd: config.DEALERSHIP_EARLY_PRICE_USD,
				earlySlots: config.DEALERSHIP_EARLY_PRICE_SLOTS,
				earlySlotsUsedOffset: config.DEALERSHIP_EARLY_SLOTS_USED_OFFSET,
				standardPriceUsd: config.DEALERSHIP_STANDARD_PRICE_USD,
			},
			crm.countPaidDealerships()
		);
	const meta = new MetaReporter(metaFromConfig(config), crm, options.now);
	const payments = new PaymentService({
		crm,
		gateway:
			options.gateway === undefined
				? paynowFromConfig(config)
				: options.gateway,
		meta,
		notifier,
		now: options.now,
		pricing,
	});
	const agent = createAngel({
		crm,
		demoUrl: config.DEMO_SITE_URL,
		knowledge: buildKnowledge(config.DEMO_SITE_URL),
		memoryUrl: `file:${resolve(dataDir, "memory.db").replace(/\\/g, "/")}`,
		meta,
		model: config.AGENT_MODEL,
		notifier,
		now: options.now,
		payments,
		pricing,
		reasoningEffort: config.AGENT_REASONING_EFFORT,
		takeoverHours: config.HUMAN_TAKEOVER_HOURS,
	});
	const relevance = new RelevanceGate(
		new JevClient({
			apiKey: config.OPENROUTER_API_KEY,
			model: JEV_MODEL,
			siteName: "Where They Are Angel",
			timeoutMs: JEV_TIMEOUT_MS,
		})
	);
	const transcriber = new ModelTranscriber({
		model: config.AGENT_MODEL,
		reasoningEffort: config.AGENT_REASONING_EFFORT,
	});
	const conversation = new ConversationService({
		agent,
		crm,
		demoUrl: config.DEMO_SITE_URL,
		maxRepliesPerHour: config.MAX_REPLIES_PER_HOUR,
		notifier,
		now: options.now,
		pricing,
		relevance,
		transcriber,
	});
	return {
		agent,
		config,
		conversation,
		crm,
		meta,
		payments,
		pricing,
		relevance,
	};
};
