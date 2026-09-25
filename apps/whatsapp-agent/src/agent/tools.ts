import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import type { CrmRepository } from "../crm/crm.repository.js";
import {
	type Customer,
	IGNORE_CATEGORIES,
	LEAD_STAGES,
	type LeadStage,
} from "../crm/crm.types.js";
import {
	type KnowledgeEntry,
	searchKnowledge,
} from "../knowledge/knowledge.js";
import type { DealershipPricing } from "../knowledge/pricing.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import { createSalesTools, type SalesToolDeps } from "./sales-tools.js";

/** Request-context key holding the digits-only customer id for the turn. */
export const CUSTOMER_ID_KEY = "customerId";
/** Request-context key Angel sets when it decides not to answer a turn. */
export const IGNORED_KEY = "ignoredAs";

export const HANDOFF_REASONS = [
	"wants_to_proceed",
	"quote_or_proposal",
	"payment",
	"hosting_domain_or_timeline",
	"discount_request",
	"competitor_example",
	"call_or_meeting",
	"custom_feature",
	"complaint_or_sensitive",
	"non_dealership_lead",
	"unsure",
	"other",
] as const;
export type HandoffReason = (typeof HANDOFF_REASONS)[number];

const REASON_LABELS: Record<HandoffReason, string> = {
	call_or_meeting: "Wants a call or meeting",
	competitor_example: "Wants a real client or competitor example",
	complaint_or_sensitive: "Complaint or sensitive matter",
	custom_feature: "Custom feature request",
	discount_request: "Pushing for a discount",
	hosting_domain_or_timeline:
		"Hosting, domain, monthly cost or timeline question",
	non_dealership_lead: "Non-dealership business lead",
	other: "Needs a person",
	payment: "Payment question or payment made",
	quote_or_proposal: "Wants a quote or proposal",
	unsure: "Angel was unsure",
	wants_to_proceed: "Ready to go ahead",
};

/** One alert per customer per reason within this window, to avoid spamming the owner. */
const ALERT_DEDUP_MS = 30 * 60 * 1000;

const OBJECTION_KINDS = [
	"too_small",
	"has_social_media",
	"price",
	"trust_or_scam_concern",
	"timing",
	"competitor_example",
	"already_has_website",
	"not_decision_maker",
	"other",
] as const;

const COMMERCIAL_SIGNALS = [
	"asked_price",
	"asked_timeline",
	"asked_next_steps",
	"asked_proposal",
	"wants_to_proceed",
	"asked_payment",
] as const;

const optionalText = z
	.string()
	.trim()
	.min(1)
	.max(300)
	.optional()
	.describe("Leave out when unknown. Never guess.");

export interface AngelToolDeps extends SalesToolDeps {
	crm: CrmRepository;
	demoUrl: string;
	knowledge: KnowledgeEntry[];
	notifier: OwnerNotifier;
	now?: () => Date;
	pricing: () => DealershipPricing;
	takeoverHours: number;
}

const customerIdFrom = (context: {
	requestContext?: { get: (key: string) => unknown };
}): string => {
	const id = context.requestContext?.get(CUSTOMER_ID_KEY);
	if (typeof id !== "string" || id.length === 0) {
		throw new Error("No customer in the request context");
	}
	return id;
};

/** The owner alert from docs/sales-script.md §5. */
export const formatHandoffAlert = (input: {
	customer: Pick<
		Customer,
		| "businessName"
		| "businessType"
		| "displayName"
		| "id"
		| "isDecisionMaker"
		| "leadScore"
		| "location"
		| "name"
		| "stage"
		| "stockSize"
		| "timing"
		| "vehicleTypes"
	>;
	reason: HandoffReason;
	summary: string;
	takeoverHours: number;
}): string => {
	const { customer } = input;
	const who = customer.name ?? customer.displayName ?? "Unknown name";
	const business = customer.businessName
		? `${customer.businessName} (${customer.businessType.replace("_", " ")})`
		: customer.businessType.replace("_", " ");
	const known = [
		customer.vehicleTypes && `Sells: ${customer.vehicleTypes}`,
		customer.stockSize && `Stock: ${customer.stockSize}`,
		customer.timing && `Wants it: ${customer.timing}`,
		customer.isDecisionMaker !== "unknown" &&
			`Decision-maker: ${customer.isDecisionMaker}`,
	].filter(Boolean);
	return [
		`🔔 *Angel hand-off: ${REASON_LABELS[input.reason]}*`,
		`${who} · ${business}${customer.location ? ` · ${customer.location}` : ""}`,
		...(known.length > 0 ? [known.join(" · ")] : []),
		`Stage: ${customer.stage} · Score: ${customer.leadScore}/10`,
		`Summary: ${input.summary}`,
		`Chat: https://wa.me/${customer.id}`,
		`Reply in their chat to take over (Angel stays quiet for ${input.takeoverHours}h). Send #resume ${customer.id} to hand back.`,
	].join("\n");
};

export const createAngelTools = (deps: AngelToolDeps) => {
	const now = deps.now ?? (() => new Date());
	const lastAlerts = new Map<string, number>();
	const { rescore, ...salesTools } = createSalesTools(deps, customerIdFrom);

	const saveCustomerDetails = createTool({
		description:
			"Save facts the customer has told you about themselves or their business. Only include fields they actually stated.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			const { note, ...patch } = input;
			deps.crm.updateProfile(id, patch);
			if (note) {
				deps.crm.appendNote(id, note);
			}
			const score = await rescore(id);
			return {
				leadScore: score?.score,
				saved: Object.keys(input),
				stage: deps.crm.get(id)?.stage,
			};
		},
		id: "save_customer_details",
		inputSchema: z.object({
			businessName: optionalText.describe("The dealership or business name"),
			businessType: z
				.enum(["car_dealership", "other"])
				.optional()
				.describe("car_dealership if they sell or broker vehicles"),
			currentChannels: optionalText.describe(
				"How customers find or contact them today, e.g. Facebook, WhatsApp, walk-ins"
			),
			hasWebsite: z.enum(["yes", "no"]).optional(),
			isDecisionMaker: z.enum(["yes", "no"]).optional(),
			location: optionalText.describe("Town and area, e.g. Msasa, Harare"),
			name: optionalText.describe("The person's own name"),
			note: optionalText.describe(
				"A short useful note for the team, e.g. a preference or concern"
			),
			otherBusinessType: optionalText.describe(
				"For non-dealerships: what the business does"
			),
			stockSize: optionalText.describe(
				"Roughly how many vehicles they usually have, in their words, e.g. about 30"
			),
			timing: optionalText.describe(
				"When they want the site live, in their words, e.g. this week"
			),
			vehicleTypes: optionalText.describe(
				"Kinds of vehicles they deal in, e.g. used Japanese imports, bakkies"
			),
			websiteUrl: optionalText.describe("Their current website address"),
		}),
	});

	const updateLeadStage = createTool({
		description:
			"Move the lead in the funnel: qualified (a real dealership with its name known), price_discussed (you've given the offer and they reacted), nurture (interested but not ready now), not_a_fit (clearly not a potential customer, e.g. a car buyer), no_response (they stopped replying after follow-up). Payment stages are set automatically.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			const result = deps.crm.setStage(id, input.stage as LeadStage, {
				by: "agent",
				reason: input.reason,
			});
			return result;
		},
		id: "update_lead_stage",
		inputSchema: z.object({
			reason: z.string().trim().min(1).max(200),
			stage: z.enum([
				"qualified",
				"price_discussed",
				"nurture",
				"not_a_fit",
				"no_response",
			]),
		}),
	});

	const shareDemoLink = createTool({
		description:
			"Get the dealership demo link to send to the customer. Records that the demo was shared.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (_input, context) => {
			const id = customerIdFrom(context);
			deps.crm.markDemoSent(id);
			return {
				about:
					"Ridgeline Motors is a made-up sample dealership we built to show what a dealership website can look like.",
				url: deps.demoUrl,
			};
		},
		id: "share_demo_link",
		inputSchema: z.object({}),
	});

	const searchKnowledgeTool = createTool({
		description:
			"Look up approved facts and answers about Where They Are, the demo, what a site includes, the process, objections, guarantees, hosting, timelines, payments and non-dealership businesses.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input) => {
			const results = searchKnowledge(deps.knowledge, input.query);
			if (results.length === 0) {
				return {
					found: false,
					guidance:
						"No approved answer. Do not guess: say a team member will confirm and call request_human.",
				};
			}
			return {
				found: true,
				results: results.map((entry) => ({
					answer: entry.answer,
					handOverAfterAnswering: entry.escalate === true,
					title: entry.title,
				})),
			};
		},
		id: "search_knowledge",
		inputSchema: z.object({
			query: z
				.string()
				.trim()
				.min(2)
				.max(200)
				.describe("What you need to know"),
		}),
	});

	const recordObjection = createTool({
		description:
			"Record an objection or hesitation the customer raised, so the team learns which objections come up.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			deps.crm.recordEvent(id, "objection", {
				kind: input.kind,
				quote: input.quote,
			});
			return { recorded: true };
		},
		id: "record_objection",
		inputSchema: z.object({
			kind: z.enum(OBJECTION_KINDS),
			quote: z
				.string()
				.trim()
				.min(1)
				.max(300)
				.describe("The customer's words, briefly"),
		}),
	});

	const logCommercialSignal = createTool({
		description:
			"Record a buying signal: the customer asked about price, timeline, next steps or a proposal, wants to proceed, or asked how to pay.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			deps.crm.recordEvent(id, "commercial_signal", { signal: input.signal });
			// Stages only move forward, so a lead past this point stays where it is.
			deps.crm.setStage(id, "price_discussed", {
				by: "agent",
				reason: input.signal,
			});
			return { recorded: true };
		},
		id: "log_commercial_signal",
		inputSchema: z.object({ signal: z.enum(COMMERCIAL_SIGNALS) }),
	});

	const requestHuman = createTool({
		description:
			"Hand the conversation to a person on the team and alert them. Use for custom work, discounts, payment problems, calls or meetings, anything you cannot answer from approved facts, and non-dealership leads.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			deps.crm.recordEvent(id, "handoff_requested", {
				reason: input.reason,
				summary: input.summary,
			});
			// Dealership leads keep their funnel stage; the event marks the hand-off.
			if (input.reason === "non_dealership_lead") {
				deps.crm.setStage(id, "human_follow_up", {
					by: "agent",
					reason: input.reason,
				});
			}
			const key = `${id}:${input.reason}`;
			const last = lastAlerts.get(key) ?? 0;
			const at = now().getTime();
			let alerted = false;
			if (at - last > ALERT_DEDUP_MS) {
				const customer = deps.crm.get(id);
				if (customer) {
					try {
						await deps.notifier.notifyOwner(
							formatHandoffAlert({
								customer,
								reason: input.reason,
								summary: input.summary,
								takeoverHours: deps.takeoverHours,
							})
						);
						lastAlerts.set(key, at);
						alerted = true;
					} catch {
						// The CRM still shows the hand-off; the owner sees it with #leads.
					}
				}
			}
			return {
				alerted,
				tellCustomer:
					"A member of the team will pick this up here on WhatsApp shortly.",
			};
		},
		id: "request_human",
		inputSchema: z.object({
			reason: z.enum(HANDOFF_REASONS),
			summary: z
				.string()
				.trim()
				.min(5)
				.max(400)
				.describe(
					"One or two sentences for the team: who they are and exactly what they want"
				),
		}),
	});

	const ignoreMessage = createTool({
		description:
			"Stay silent on this turn. ONLY for spam or scams, personal messages meant for the founder (friends, family, personal favours), wrong numbers, or people pitching their services or asking for jobs. Never for anyone who might want a website for any kind of business.",
		execute: (input, context) => {
			context.requestContext?.set(IGNORED_KEY, input.category);
			return Promise.resolve({
				ignored: true,
				instruction: "Do not write a reply. Output nothing.",
			});
		},
		id: "ignore_message",
		inputSchema: z.object({ category: z.enum(IGNORE_CATEGORIES) }),
	});

	return {
		...salesTools,
		ignore_message: ignoreMessage,
		log_commercial_signal: logCommercialSignal,
		record_objection: recordObjection,
		request_human: requestHuman,
		save_customer_details: saveCustomerDetails,
		search_knowledge: searchKnowledgeTool,
		share_demo_link: shareDemoLink,
		update_lead_stage: updateLeadStage,
	};
};

export const isLeadStage = (value: string): value is LeadStage =>
	(LEAD_STAGES as readonly string[]).includes(value);
