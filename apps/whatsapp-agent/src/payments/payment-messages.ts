import type { Customer, Payment } from "../crm/crm.types.js";
import { PLANS, usd } from "../knowledge/offer.js";

const firstName = (customer: Customer): string => {
	const name = customer.name ?? customer.displayName;
	return name ? ` ${name.split(" ")[0]}` : "";
};

const planName = (payment: Payment): string =>
	payment.plan ? PLANS[payment.plan].name : "your plan";

/**
 * Sent the moment Paynow confirms the first month, with what we need to start
 * (docs/sales-script.md §2, "What we need after they pay").
 */
export const firstMonthPaidMessage = (
	customer: Customer,
	payment: Payment
): string =>
	[
		`Payment received, thank you${firstName(customer)}! 🎉 Welcome to Where They Are. You're on the ${planName(payment)}.`,
		"",
		"To create your first posts, please send us:",
		"• photos and details of the vehicles you'd like to show (price, mileage, engine, gearbox and duty status where relevant)",
		"• your logo, colours and the contact details to put on your posts",
		"• any offers, events or dealership updates you'd like included",
		"",
		"Our team will also guide you on giving us access to post on your Facebook and Instagram pages.",
	].join("\n");

export const renewalPaidMessage = (
	customer: Customer,
	payment: Payment
): string =>
	`Payment received, thank you${firstName(customer)}! Your ${planName(payment)} continues for another month. 🙌`;

/** The link message Angel's reply is built around, so the link is always exact. */
export const paymentLinkMessage = (payment: Payment): string =>
	`Here's your secure Paynow link for ${usd(payment.amountUsd)} (${planName(payment)}). You can pay by card, bank or mobile money:\n${payment.link ?? ""}\n\nI'll confirm here as soon as Paynow tells us it's paid.`;

const REASONS: Partial<Record<Payment["status"], string>> = {
	cancelled: "was cancelled",
	failed: "didn't go through",
};

export const paymentFailedMessage = (payment: Payment): string =>
	`The ${usd(payment.amountUsd)} payment ${REASONS[payment.status] ?? "didn't complete"}. Would you like me to send it again? I can use a different EcoCash or OneMoney number, or send a Paynow link for card or bank payment.`;

export const paymentExpiredMessage = (payment: Payment): string =>
	`The ${usd(payment.amountUsd)} payment prompt expired before it was approved. Would you like me to send it again, or send a Paynow link instead?`;

export const paymentHandedOverMessage =
	"The payment still didn't go through, so I've asked a member of our team to help you sort it out here on WhatsApp.";
