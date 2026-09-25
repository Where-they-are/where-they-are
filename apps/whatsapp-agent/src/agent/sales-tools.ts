import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import type { CrmRepository } from "../crm/crm.repository.js";
import { PAYMENT_KINDS, PAYMENT_METHODS } from "../crm/crm.types.js";
import { QUALIFIED_SCORE, scoreLead } from "../crm/lead-score.js";
import { type DealershipPricing, OFFER_TERMS } from "../knowledge/pricing.js";
import type { MetaReporter } from "../meta/meta-reporter.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import type {
	PaymentRequestResult,
	PaymentService,
} from "../payments/payment.service.js";
import { checkWallet } from "../payments/wallet.js";

export interface SalesToolDeps {
	crm: CrmRepository;
	meta: MetaReporter;
	notifier: OwnerNotifier;
	payments: PaymentService;
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

const PAYMENT_GUIDANCE: Record<
	Exclude<PaymentRequestResult, { ok: true }>["reason"],
	string
> = {
	already_paid:
		"This payment is already confirmed. Do not ask for it again; thank them instead.",
	deposit_not_paid:
		"The deposit is not paid yet, so there is no balance to pay. Offer the deposit instead if they want to start.",
	not_configured:
		"Payments can't be taken in the chat right now. Tell them a member of the team will send the payment details here shortly. The team has been alerted.",
	not_delivered:
		"The balance is only due after the site is delivered. Tell them there is nothing to pay until then.",
	provider_error:
		"Paynow could not send the request. Apologise, check the number with them, and offer to try once more. If it fails again, hand over with request_human (reason: payment).",
	unknown_customer: "Something went wrong. Hand over with request_human.",
};

/** Mastra tools for the offer, the lead score and Paynow payments. */
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

	const requestPayment = createTool({
		description:
			"Send a Paynow payment prompt to the customer's EcoCash or OneMoney wallet. Use kind 'deposit' only once they clearly want to go ahead and have told you which number to use (it can be the WhatsApp number they're chatting from). Use kind 'balance' only when they ask to pay after their site is delivered. Never ask for PINs or passwords.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			const wallet = checkWallet(input.phone, input.method);
			if (!wallet.ok) {
				return {
					ok: false,
					tellCustomer:
						wallet.problem === "unsupported_network"
							? "We can take EcoCash (077/078) or OneMoney (071). Ask which EcoCash or OneMoney number to use."
							: "That doesn't look like a Zimbabwe mobile number. Ask them to check it.",
				};
			}
			const result = await deps.payments.request({
				customerId: id,
				kind: input.kind,
				method: wallet.method,
				phone: wallet.phone,
			});
			if (result.ok) {
				return {
					amountUsd: result.amountUsd,
					ok: true,
					tellCustomer: `A ${wallet.method === "ecocash" ? "EcoCash" : "OneMoney"} prompt for $${result.amountUsd} has been sent to ${wallet.phone.replace("263", "0")}. Ask them to approve it on their phone with their PIN. You'll confirm here once it's through.${result.status === "already_pending" ? " (A prompt was already waiting, so no new one was sent.)" : ""}`,
				};
			}
			if (result.reason === "not_configured") {
				await deps.notifier
					.notifyOwner(
						`💳 ${id} wants to pay the ${input.kind} but Paynow isn't set up in Angel. Please send them payment details: https://wa.me/${id}`
					)
					.catch(() => undefined);
			}
			return {
				ok: false,
				reason: result.reason,
				tellCustomer: PAYMENT_GUIDANCE[result.reason],
			};
		},
		id: "request_payment",
		inputSchema: z.object({
			kind: z.enum(PAYMENT_KINDS),
			method: z
				.enum(PAYMENT_METHODS)
				.optional()
				.describe("Leave out to detect it from the number"),
			phone: z
				.string()
				.trim()
				.min(9)
				.max(20)
				.describe(
					"The wallet number to charge, as the customer gave it, e.g. 0771234567"
				),
		}),
	});

	const checkPayment = createTool({
		description:
			"Check the latest deposit or balance payment with Paynow, e.g. when the customer says they've approved it or paid.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			const payment = await deps.payments.refresh(id, input.kind);
			if (!payment) {
				return {
					status: "none",
					tellCustomer: "No payment request has been sent yet.",
				};
			}
			const guidance: Record<typeof payment.status, string> = {
				cancelled:
					"It was cancelled. Offer to send the request again (request_payment).",
				created: "It's still being set up. Ask them to wait a moment.",
				expired:
					"It expired before it was approved. Offer to send it again (request_payment).",
				failed:
					"It didn't go through. Offer to send it again, or to use another number.",
				paid: "It's confirmed as paid. The confirmation has already been sent, so just thank them.",
				sent: "Paynow hasn't confirmed it yet. Ask them to approve the prompt on their phone; you'll confirm here as soon as it's through. Never say it's paid until it is.",
			};
			return {
				amountUsd: payment.amountUsd,
				status: payment.status,
				tellCustomer: guidance[payment.status],
			};
		},
		id: "check_payment",
		inputSchema: z.object({ kind: z.enum(PAYMENT_KINDS).default("deposit") }),
	});

	return {
		check_payment: checkPayment,
		get_offer: getOffer,
		request_payment: requestPayment,
		rescore,
		update_lead_signals: updateLeadSignals,
	};
};
