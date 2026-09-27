import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import type { CrmRepository } from "../crm/crm.repository.js";
import { QUALIFIED_SCORE, scoreLead } from "../crm/lead-score.js";
import { type DealershipPricing, OFFER_TERMS } from "../knowledge/pricing.js";
import type { MetaReporter } from "../meta/meta-reporter.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";

export interface SalesToolDeps {
	crm: CrmRepository;
	meta: MetaReporter;
	notifier: OwnerNotifier;
	pricing: () => DealershipPricing;
}

type CustomerIdFrom = (context: {
	requestContext?: { get: (key: string) => unknown };
}) => string;

const BAND_ADVICE = {
	close_now:
		"Hot lead: if they have not asked to go ahead yet, ask whether they would like to reserve their site with the deposit.",
	low: "Keep it light: answer their questions and keep qualifying.",
	nurture:
		"Interested but not ready: keep helping, ask the next useful question, and don't push for payment.",
} as const;

/** Mastra tools for the offer and the lead score. */
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
		const qualifiedDealership =
			customer.businessType === "car_dealership" &&
			result.score >= QUALIFIED_SCORE;
		if (qualifiedDealership) {
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
			"Get the current dealership offer: the headline (lead with it, word for word or close), the other terms (mention each only when relevant), and what's included. Not for non-dealership businesses.",
		// biome-ignore lint/suspicious/useAwait: Mastra tool executors return promises
		execute: async () => {
			const pricing = deps.pricing();
			return {
				foundingPlacesLeft: pricing.isEarlyPrice
					? `${pricing.earlySlotsLeft} of ${pricing.earlySlotsTotal} (only say this if asked)`
					: "none: the founding offer is over",
				headline: pricing.headline,
				included: `One mobile-friendly dealership website with up to ${OFFER_TERMS.maxSections} pages or sections, all their existing stock imported, vehicle listings with photos and details, dealership details, location, opening hours and WhatsApp/call/enquiry buttons, one design direction and ${OFFER_TERMS.revisionRounds} round of changes. Anything else is custom work the team quotes separately.`,
				terms: pricing.terms,
			};
		},
		id: "get_offer",
		inputSchema: z.object({}),
	});

	const updateLeadSignals = createTool({
		description:
			"Record what you've learned that affects how ready the lead is: price within reach, wants the site live within 30 days, has stock photos/details ready, engaged with the demo. Only set what they actually told you. Returns the lead score and what to do next.",
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
			engagedWithDemo: z
				.boolean()
				.optional()
				.describe("They commented on or asked about the demo"),
			priceWithinReach: z
				.boolean()
				.optional()
				.describe("They said the price or the deposit works for them"),
			stockReady: z
				.boolean()
				.optional()
				.describe("They have photos and details of their stock ready"),
			wantsLiveWithin30Days: z
				.boolean()
				.optional()
				.describe("They want the site live within about a month"),
		}),
	});

	return {
		get_offer: getOffer,
		rescore,
		update_lead_signals: updateLeadSignals,
	};
};
