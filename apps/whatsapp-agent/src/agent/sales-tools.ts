import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import type { CrmRepository } from "../crm/crm.repository.js";
import { QUALIFIED_SCORE, scoreLead } from "../crm/lead-score.js";
import {
	DESIRED_FREQUENCIES,
	PLAN_IDS,
	recommendPlan,
	type SocialMediaOffer,
} from "../knowledge/offer.js";
import type { MetaReporter } from "../meta/meta-reporter.js";

export interface SalesToolDeps {
	crm: CrmRepository;
	/** An approved page or album of example posts, if there is one. */
	examplesUrl: string;
	meta: MetaReporter;
	offer: () => SocialMediaOffer;
}

type CustomerIdFrom = (context: {
	requestContext?: { get: (key: string) => unknown };
}) => string;

const BAND_ADVICE = {
	close_now:
		"Serious lead: if you haven't recommended a plan yet, do it now; if they've shown interest in it, ask whether they'd like to get started. Once they say yes, hand over with request_human (reason ready_to_start).",
	low: "Keep it light: answer their question and ask the next useful qualifying question.",
	nurture:
		"Interested but not there yet: keep helping, ask the next useful question, and don't push.",
} as const;

/** Mastra tools for the offer, plan recommendations, examples and the lead score. */
export const createSalesTools = (
	deps: SalesToolDeps,
	customerIdFrom: CustomerIdFrom
) => {
	/** Re-scores a lead after its profile or signals change. */
	const rescore = async (id: string) => {
		const customer = deps.crm.get(id);
		if (!customer) {
			return null;
		}
		const result = scoreLead(customer);
		if (result.score !== customer.leadScore) {
			deps.crm.setLeadSignals(id, customer.leadSignals, result.score);
			deps.crm.recordEvent(id, "score_changed", {
				from: customer.leadScore,
				reasons: result.reasons,
				to: result.score,
			});
		}
		if (
			customer.businessType === "car_dealership" &&
			result.score >= QUALIFIED_SCORE
		) {
			deps.crm.setStage(id, "qualified", {
				by: "agent",
				reason: `lead score ${result.score}`,
			});
			await deps.meta.report({ customerId: id, eventName: "QualifiedLead" });
		}
		return result;
	};

	const getOffer = createTool({
		description:
			"Get the three social media plans, their exact prices, whether the launch offer is still open, what every plan includes, and which terms only the owner can confirm. Use it before stating any price.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async () => {
			const offer = deps.offer();
			return {
				includes: offer.includes,
				launchOffer: offer.launchOfferOpen
					? `50% off the first month of Growth or Pro for the first ${offer.launchPlacesTotal} dealerships (${offer.launchPlacesLeft} places left: only say this if asked). Starter has no launch discount.`
					: "The launch offer is over: quote normal prices only.",
				ownerConfirms: offer.notDecided,
				plans: offer.summary,
			};
		},
		id: "get_offer",
		inputSchema: z.object({}),
	});

	const recommendPlanTool = createTool({
		description:
			"Recommend ONE plan once you know how often they want to appear in front of buyers. Returns the exact recommendation to send (you may drop 'Based on that' if they asked for the plan directly). Also use it when they ask about a specific plan.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			const planId = input.plan ?? recommendPlan(input.desiredFrequency);
			const plan = deps.offer().plans[planId];
			deps.crm.setPlan(id, "recommended", planId);
			deps.crm.recordEvent(id, "plan_recommended", {
				desiredFrequency: input.desiredFrequency,
				plan: planId,
			});
			deps.crm.setStage(id, "plan_recommended", {
				by: "agent",
				reason: `recommended ${planId}`,
			});
			await rescore(id);
			return {
				firstMonthUsd: plan.firstMonthUsd,
				nextQuestion: "Would you like to get started with that plan?",
				pitch: plan.pitch,
				plan: plan.name,
			};
		},
		id: "recommend_plan",
		inputSchema: z.object({
			desiredFrequency: z
				.enum(DESIRED_FREQUENCIES)
				.describe(
					"How often they want to appear in front of buyers. 'unsure' if they didn't say."
				),
			plan: z
				.enum(PLAN_IDS)
				.optional()
				.describe("Only if they asked for a specific plan by name"),
		}),
	});

	const shareExamples = createTool({
		description:
			"Get approved examples of our dealership posts to share when they ask to see our work.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async (_input, context) => {
			const id = customerIdFrom(context);
			if (!deps.examplesUrl) {
				return {
					available: false,
					guidance:
						"No examples are approved to share yet. Say the team will send some examples here, and hand over with request_human (reason examples).",
				};
			}
			deps.crm.recordEvent(id, "examples_shared", { url: deps.examplesUrl });
			return {
				available: true,
				note: "These are examples of the kind of posts we create. Share the link once.",
				url: deps.examplesUrl,
			};
		},
		id: "share_examples",
		inputSchema: z.object({}),
	});

	const updateLeadSignals = createTool({
		description:
			"Record what you've learned about how ready the lead is: clearNeed (they post irregularly, only when stock comes in, or want to appear more often), priceWithinReach (they said the plan's price works), activeFacebookPage (they have a Facebook page they use), photosReady (they have vehicle photos and details ready). Only set what they actually told you. Returns the lead score and what to do next.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			const customer = deps.crm.get(id);
			if (!customer) {
				return { error: "Unknown customer" };
			}
			const signals = { ...customer.leadSignals };
			for (const [key, value] of Object.entries(input)) {
				if (typeof value === "boolean") {
					signals[key as keyof typeof signals] = value;
				}
			}
			deps.crm.setLeadSignals(id, signals, customer.leadScore);
			const result = await rescore(id);
			return result
				? {
						advice: BAND_ADVICE[result.band],
						band: result.band,
						score: result.score,
					}
				: { error: "Unknown customer" };
		},
		id: "update_lead_signals",
		inputSchema: z.object({
			activeFacebookPage: z.boolean().optional(),
			clearNeed: z.boolean().optional(),
			photosReady: z.boolean().optional(),
			priceWithinReach: z.boolean().optional(),
		}),
	});

	return {
		get_offer: getOffer,
		recommend_plan: recommendPlanTool,
		rescore,
		share_examples: shareExamples,
		update_lead_signals: updateLeadSignals,
	};
};
