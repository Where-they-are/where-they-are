import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import type { Payment } from "../crm/crm.types.js";
import { PLAN_IDS, PLANS, usd } from "../knowledge/offer.js";
import type { PaymentService } from "../payments/payment.service.js";
import { checkWallet } from "../payments/wallet.js";

/** Request-context key holding a Paynow link Angel's reply must contain. */
export const PAYMENT_LINK_KEY = "paymentLink";

type CustomerIdFrom = (context: {
	requestContext?: { get: (key: string) => unknown };
}) => string;

interface ToolContext {
	requestContext?: {
		get: (key: string) => unknown;
		set: (key: string, value: unknown) => void;
	};
}

const PAY_METHODS = ["ecocash", "onemoney", "link"] as const;

const HAND_OVER =
	'Say: "Thank you. I\'ll pass this to our team now to confirm your start and how to pay." Then call request_human with reason ready_to_start.';

const localNumber = (phone: string) => `0${phone.slice(3)}`;

const BAD_WALLET =
	"That number can't take an EcoCash or OneMoney prompt. Ask for their EcoCash (077/078) or OneMoney (071) number, or offer a Paynow link instead.";

const failureGuidance = (result: {
	error?: string;
	reason: string;
}): string => {
	if (result.reason === "already_client") {
		return "They're already a client, so the first month is paid. Anything about later payments goes to the team: hand over with reason payment_or_terms.";
	}
	if (result.reason === "provider_error") {
		return `Paynow couldn't send it (${result.error ?? "unknown error"}). Apologise briefly and offer the other way to pay (a Paynow link, or an EcoCash/OneMoney prompt to a different number).`;
	}
	return HAND_OVER;
};

const WAITING_GUIDANCE: Record<Payment["method"], string> = {
	ecocash:
		"The EcoCash prompt is still waiting. Ask them to check their phone for the prompt and approve it with their PIN; offer to send it again or send a Paynow link if it didn't arrive.",
	link: "Paynow hasn't received the payment yet. If they say they've paid, say it can take a minute to come through and you'll confirm here as soon as it does.",
	onemoney:
		"The OneMoney prompt is still waiting. Ask them to check their phone for the prompt and approve it with their PIN; offer to send it again or send a Paynow link if it didn't arrive.",
};

/**
 * Tools for the close: Angel sends a Paynow prompt or link for the first
 * month, and checks Paynow when a customer says they've paid. Only Paynow
 * decides whether something is paid.
 */
export const createPaymentTools = (
	payments: PaymentService,
	customerIdFrom: CustomerIdFrom,
	/** A lead who asks to pay has accepted the price: re-score them. */
	onReadyToPay: (customerId: string) => Promise<void>
) => {
	const requestPayment = createTool({
		description:
			"Take the first month's payment once they've chosen a plan and told you how they'd like to pay. Sends an EcoCash or OneMoney prompt to their phone, or creates a Paynow link for card, bank or mobile money. Returns what to tell them.",
		execute: async (input, context) => {
			const id = customerIdFrom(context);
			if (!payments.enabled) {
				return { guidance: HAND_OVER, sent: false };
			}
			const wallet =
				input.method === "link"
					? null
					: checkWallet(input.walletNumber ?? id, input.method);
			if (wallet && !wallet.ok) {
				return { guidance: BAD_WALLET, sent: false };
			}
			const result = await payments.request({
				customerId: id,
				kind: "first_month",
				method: input.method,
				plan: input.plan,
				...(wallet ? { phone: wallet.phone } : {}),
			});
			if (!result.ok) {
				return { guidance: failureGuidance(result), sent: false };
			}
			await onReadyToPay(id);
			const amount = usd(result.amountUsd);
			const plan = PLANS[result.plan].name;
			if (result.link) {
				(context as ToolContext).requestContext?.set(
					PAYMENT_LINK_KEY,
					result.link
				);
				return {
					amount,
					guidance: `Send this exact link on its own line: ${result.link}
Say it's a secure Paynow link for ${amount} for the first month of the ${plan}, that they can pay by card, bank or mobile money, and that you'll confirm here as soon as Paynow tells us it's paid. Never say it's paid before then.`,
					link: result.link,
					plan,
					sent: true,
				};
			}
			const walletName = input.method === "ecocash" ? "EcoCash" : "OneMoney";
			return {
				amount,
				guidance: `Tell them a ${walletName} prompt for ${amount} (first month of the ${plan}) is on its way to ${localNumber(wallet?.phone ?? id)}, and they approve it by entering their PIN on their phone, never by sending it to us. Say you'll confirm here as soon as Paynow tells us it's paid. Never say it's paid before then.`,
				paynowInstructions: result.instructions,
				plan,
				sent: true,
			};
		},
		id: "request_payment",
		inputSchema: z.object({
			method: z
				.enum(PAY_METHODS)
				.describe(
					"ecocash or onemoney for a prompt on their phone; link for a Paynow page (card, bank or mobile money)"
				),
			plan: z.enum(PLAN_IDS).describe("The plan they chose"),
			walletNumber: z
				.string()
				.optional()
				.describe(
					"The EcoCash/OneMoney number to prompt, only if they gave one different from this chat's number"
				),
		}),
	});

	const checkPayment = createTool({
		description:
			"Ask Paynow whether their first-month payment has come through. Use it when they say they've paid or ask about their payment. Never confirm a payment without it.",
		execute: async (_input, context) => {
			const id = customerIdFrom(context);
			const payment = await payments.refresh(id, "first_month");
			if (!payment) {
				return {
					guidance:
						"No payment has been requested yet. If they want to start, ask how they'd like to pay and use request_payment.",
					status: "none",
				};
			}
			if (payment.status === "paid") {
				return {
					guidance:
						"Paynow confirms it's paid. The confirmation and the list of what we need were already sent in this chat: don't repeat them. Thank them briefly and help with anything they ask.",
					status: "paid",
				};
			}
			if (payment.status === "sent") {
				return {
					guidance: WAITING_GUIDANCE[payment.method],
					link: payment.link,
					status: "waiting",
				};
			}
			return {
				guidance:
					"The last payment didn't go through. Ask whether they'd like you to send it again or use the other way to pay.",
				status: payment.status,
			};
		},
		id: "check_payment",
		inputSchema: z.object({}),
	});

	return { check_payment: checkPayment, request_payment: requestPayment };
};
