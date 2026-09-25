import type { Customer, Payment } from "../crm/crm.types.js";
import { OFFER_TERMS, usd } from "../knowledge/pricing.js";

const firstName = (customer: Customer): string => {
	const name = customer.name ?? customer.displayName;
	return name ? ` ${name.split(" ")[0]}` : "";
};

/** Sent the moment Paynow confirms the deposit (docs/sales-script.md §2, Close). */
export const depositPaidMessage = (customer: Customer): string =>
	[
		`Payment received, thank you${firstName(customer)}! 🎉 Your dealership website is now in our build queue.`,
		"",
		"To get started, please send:",
		"• your logo (if you have one)",
		"• dealership name, address, phone number and opening hours",
		"• photos and details of your current stock (price, year, mileage, and anything else you'd like shown)",
		"• the domain name you'd like, e.g. yourdealership.co.zw",
		"",
		`Once we have these, your site will be ready within ${OFFER_TERMS.deliveryDays} days. We'll send you the link here.`,
	].join("\n");

export const balancePaidMessage = (customer: Customer): string =>
	[
		`Payment received, thank you${firstName(customer)}! Your website is now fully paid. 🎉`,
		"",
		`Hosting is free for the first month, then ${usd(OFFER_TERMS.hostingMonthlyUsd)}/month, and the team will be in touch before the free month ends. If anything on the site isn't working, message us here and we'll fix it free within ${OFFER_TERMS.fixHours} hours.`,
	].join("\n");

const REASONS: Partial<Record<Payment["status"], string>> = {
	cancelled: "it was cancelled",
	failed: "it didn't go through",
};

export const paymentFailedMessage = (payment: Payment): string =>
	`The ${usd(payment.amountUsd)} payment request ${REASONS[payment.status] ?? "didn't complete"}. Would you like me to send it again? You can also give me a different EcoCash or OneMoney number.`;

export const paymentExpiredMessage = (payment: Payment): string =>
	`The ${usd(payment.amountUsd)} payment request expired before it was approved. Would you like me to send it again?`;
