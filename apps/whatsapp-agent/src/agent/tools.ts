import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import type { CrmRepository } from "../crm/crm.repository.js";
import {
	CLOSE_CATEGORIES,
	type Customer,
	IGNORE_CATEGORIES,
	LEAD_STAGES,
	type LeadStage,
} from "../crm/crm.types.js";
import {
	type KnowledgeEntry,
	searchKnowledge,
} from "../knowledge/knowledge.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import type { PaymentService } from "../payments/payment.service.js";
import { createPaymentTools } from "./payment-tools.js";
import { createSalesTools, type SalesToolDeps } from "./sales-tools.js";

/** Request-context key holding the digits-only customer id for the turn. */
export const CUSTOMER_ID_KEY = "customerId";
/** Request-context key Angel sets when it decides not to answer a turn. */
export const IGNORED_KEY = "ignoredAs";

/** Why Angel hands a chat to the owner (docs/sales-script.md §6). */
export const HANDOFF_REASONS = [
	"ready_to_start",
	"qualified_prospect",
	"custom_package_or_discount",
	"other_service",
	"payment_or_terms",
	"examples",
	"call_or_meeting",
	"complaint_or_sensitive",
	"other_business",
	"unsure",
	"other",
] as const;
export type HandoffReason = (typeof HANDOFF_REASONS)[number];

const REASON_LABELS: Record<HandoffReason, string> = {
	call_or_meeting: "Wants a call or meeting",
	complaint_or_sensitive: "Upset, complaint or sensitive matter",
	custom_package_or_discount: "Wants a custom package or discount",
	examples: "Wants to see examples of our posts",
	other: "Needs a person",
	other_business: "Not a dealership (future market)",
	other_service:
		"Wants another service (website, ads, photography, branding...)",
	payment_or_terms: "Question about payment, contract or terms",
	qualified_prospect: "Serious qualified prospect",
	ready_to_start: "Ready to start: confirm and take payment",
	unsure: "Angel was unsure",
};

/** One alert per customer per reason within this window, to avoid spamming the owner. */
const ALERT_DEDUP_MS = 30 * 60 * 1000;

const OBJECTION_KINDS = [
	"price",
	"already_posts_themselves",
	"doubts_results",
	"needs_time",
	"no_good_photos",
	"trust_or_scam_concern",
	"no_instagram",
	"not_decision_maker",
	"other",
] as const;

const COMMERCIAL_SIGNALS = [
	"asked_price",
	"asked_how_to_start",
	"asked_payment_or_terms",
	"wants_to_start",
	"asked_other_services",
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
	knowledge: KnowledgeEntry[];
	notifier: OwnerNotifier;
	now?: () => Date;
	payments: PaymentService;
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

/** The owner alert from docs/sales-script.md §6. */
export const formatHandoffAlert = (input: {
	customer: Pick<
		Customer,
		| "businessName"
		| "businessType"
		| "desiredFrequency"
		| "displayName"
		| "facebookUrl"
		| "id"
		| "instagramUrl"
		| "isDecisionMaker"
		| "leadScore"
		| "location"
		| "name"
		| "postingHabit"
		| "recommendedPlan"
		| "stage"
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
		customer.postingHabit && `Posts now: ${customer.postingHabit}`,
		customer.desiredFrequency && `Wants: ${customer.desiredFrequency}`,
		customer.recommendedPlan && `Recommended: ${customer.recommendedPlan}`,
		customer.isDecisionMaker !== "unknown" &&
			`Decision-maker: ${customer.isDecisionMaker}`,
	].filter(Boolean);
	const pages = [customer.facebookUrl, customer.instagramUrl].filter(Boolean);
	return [
		`🔔 *Angel hand-off: ${REASON_LABELS[input.reason]}*`,
		`${who} · ${business}${customer.location ? ` · ${customer.location}` : ""}`,
		...(known.length > 0 ? [known.join(" · ")] : []),
		...(pages.length > 0 ? [`Pages: ${pages.join(" · ")}`] : []),
		`Stage: ${customer.stage} · Score: ${customer.leadScore}/10`,
		`Summary: ${input.summary}`,
		`Chat: https://wa.me/${customer.id}`,
		`Reply in their chat to take over (Angel stays quiet for ${input.takeoverHours}h). Send #resume ${customer.id} to hand back, or #client ${customer.id} <plan> once they've paid.`,
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
				.describe(
					"car_dealership if they sell, import or trade vehicles; other for any other business"
				),
			desiredFrequency: optionalText.describe(
				"How often they want to appear in front of buyers, in their words"
			),
			facebookUrl: optionalText.describe("Their Facebook page link or name"),
			instagramUrl: optionalText.describe(
				"Their Instagram page link or handle"
			),
			isDecisionMaker: z.enum(["yes", "no"]).optional(),
			location: optionalText.describe("City or town, e.g. Mutare"),
			name: optionalText.describe("The person's own name"),
			note: optionalText.describe(
				"A short useful note for the team, e.g. a preference or concern"
			),
			otherBusinessType: optionalText.describe(
				"For non-dealerships: what the business does"
			),
			postingHabit: optionalText.describe(
				"How they post on Facebook and Instagram today, e.g. only when new stock arrives"
			),
			stockSize: optionalText.describe(
				"Roughly how many vehicles they usually have, in their words"
			),
			timing: optionalText.describe(
				"When they want to start, in their words, e.g. next week"
			),
			vehicleTypes: optionalText.describe(
				"Kinds of vehicles they sell, e.g. Japanese imports, bakkies"
			),
		}),
	});

	const updateLeadStage = createTool({
		description:
			"Move the lead in the funnel: qualified (a real dealership, name and city known), nurture (interested but not ready now), not_a_fit (clearly not a potential client, e.g. someone looking to buy a car), no_response (stopped replying). Plan and hand-off stages are set by the other tools.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			return deps.crm.setStage(id, input.stage as LeadStage, {
				by: "agent",
				reason: input.reason,
			});
		},
		id: "update_lead_stage",
		inputSchema: z.object({
			reason: z.string().trim().min(1).max(200),
			stage: z.enum(["qualified", "nurture", "not_a_fit", "no_response"]),
		}),
	});

	const searchKnowledgeTool = createTool({
		description:
			"Look up approved answers about Where They Are, the plans, what's included, how we work, objections, guarantees, other services and other businesses.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input) => {
			const results = searchKnowledge(deps.knowledge, input.query);
			if (results.length === 0) {
				return {
					found: false,
					guidance:
						"No approved answer. Do not guess: say the team will confirm and call request_human.",
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
			"Record a buying signal: they asked the price, how to start, about payment or terms, said they want to start, or asked about other services.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			deps.crm.recordEvent(id, "commercial_signal", { signal: input.signal });
			return { recorded: true };
		},
		id: "log_commercial_signal",
		inputSchema: z.object({ signal: z.enum(COMMERCIAL_SIGNALS) }),
	});

	const requestHuman = createTool({
		description:
			"Hand the conversation to the owner and alert them. Use ready_to_start when they want to begin (after collecting their dealership, city, Facebook page, Instagram if any, and the plan); also for custom packages or discounts, other services, payment or terms questions, examples when none are approved, calls, complaints, serious prospects, other businesses, and anything you can't answer.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			deps.crm.recordEvent(id, "handoff_requested", {
				reason: input.reason,
				summary: input.summary,
			});
			if (input.reason === "ready_to_start") {
				deps.crm.setStage(id, "ready_to_start", {
					by: "agent",
					reason: input.summary,
				});
			}
			if (input.reason === "other_business") {
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
					input.reason === "ready_to_start"
						? "Thank them and say you'll pass this to the team now to confirm their start and how to pay; once that's done, we'll ask for their vehicle photos and details."
						: "Say a member of the team will pick this up here on WhatsApp shortly.",
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
					"One or two sentences for the owner: who they are and exactly what they want"
				),
		}),
	});

	const ignoreMessage = createTool({
		description:
			"Stay silent on this turn. For spam or scams, personal messages meant for the founder, wrong numbers, people pitching services or asking for jobs, and in an ongoing chat: a firm 'not interested' or 'stop messaging me' (not_interested), a firm 'I'll think about it and get back to you' with no question (will_get_back), a closing message that needs nothing more (conversation_over), or meaningless or low-quality messages (low_quality). Never for a lead with a question, or anyone who might want our service.",
		execute: (input, context) => {
			context.requestContext?.set(IGNORED_KEY, input.category);
			return Promise.resolve({
				ignored: true,
				instruction: "Do not write a reply. Output nothing.",
			});
		},
		id: "ignore_message",
		inputSchema: z.object({
			category: z.enum([...IGNORE_CATEGORIES, ...CLOSE_CATEGORIES]),
		}),
	});

	return {
		...salesTools,
		...createPaymentTools(deps.payments, customerIdFrom, async (id) => {
			const customer = deps.crm.get(id);
			if (!customer || customer.leadSignals.priceWithinReach) {
				return;
			}
			const signals = { ...customer.leadSignals, priceWithinReach: true };
			deps.crm.setLeadSignals(id, signals, customer.leadScore);
			await rescore(id);
		}),
		ignore_message: ignoreMessage,
		log_commercial_signal: logCommercialSignal,
		record_objection: recordObjection,
		request_human: requestHuman,
		save_customer_details: saveCustomerDetails,
		search_knowledge: searchKnowledgeTool,
		update_lead_stage: updateLeadStage,
	};
};

export const isLeadStage = (value: string): value is LeadStage =>
	(LEAD_STAGES as readonly string[]).includes(value);
