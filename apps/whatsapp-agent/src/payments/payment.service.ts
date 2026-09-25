import type {
	MobilePaymentRequest,
	MobilePaymentResult,
	PaynowStatus,
} from "@where-they-are/paynow";

import type { CrmRepository } from "../crm/crm.repository.js";
import {
	type Customer,
	PAID_STAGES,
	type Payment,
	type PaymentKind,
	type PaymentMethod,
} from "../crm/crm.types.js";
import {
	type DealershipPricing,
	OFFER_TERMS,
	usd,
} from "../knowledge/pricing.js";
import type { MetaReporter } from "../meta/meta-reporter.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import {
	balancePaidMessage,
	depositPaidMessage,
	paymentExpiredMessage,
	paymentFailedMessage,
} from "./payment-messages.js";

/** The Paynow calls the service needs; PaynowClient implements it. */
export interface PaymentGateway {
	poll: (pollUrl: string) => Promise<PaynowStatus | null>;
	requestMobilePayment: (
		request: MobilePaymentRequest
	) => Promise<MobilePaymentResult>;
}

/** Sends a message into a customer's WhatsApp chat outside a reply turn. */
export interface CustomerMessenger {
	sendToCustomer: (chatId: string, text: string) => Promise<void>;
}

export type PaymentRequestResult =
	| {
			amountUsd: number;
			instructions: string | null;
			ok: true;
			reference: string;
			status: "sent" | "already_pending";
	  }
	| {
			error?: string;
			ok: false;
			reason:
				| "not_configured"
				| "unknown_customer"
				| "already_paid"
				| "deposit_not_paid"
				| "not_delivered"
				| "provider_error";
	  };

export interface PaymentServiceDeps {
	crm: CrmRepository;
	/** Null when Paynow is not configured: requests are handed to the owner. */
	gateway: PaymentGateway | null;
	meta: MetaReporter;
	notifier: OwnerNotifier;
	now?: () => Date;
	pollIntervalMs?: number;
	/** How long a customer has to approve the prompt before it expires. */
	pollTimeoutMs?: number;
	pricing: () => DealershipPricing;
}

const DEFAULT_POLL_INTERVAL_MS = 10_000;
const DEFAULT_POLL_TIMEOUT_MS = 10 * 60 * 1000;
/** A failed attempt this many times in a row goes to the owner. */
const FAILURES_BEFORE_HANDOFF = 2;

const KIND_LABELS: Record<PaymentKind, string> = {
	balance: "Dealership website balance",
	deposit: "Dealership website deposit",
};

const who = (customer: Customer) =>
	customer.name ?? customer.displayName ?? customer.id;

/**
 * Takes the website deposit and balance with Paynow mobile checkout. A
 * payment only counts once Paynow reports it paid, through the result URL or
 * by polling; each outcome is acted on exactly once.
 */
export class PaymentService {
	private readonly deps: PaymentServiceDeps;
	private readonly now: () => Date;
	private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
	private messenger: CustomerMessenger | null = null;

	constructor(deps: PaymentServiceDeps) {
		this.deps = deps;
		this.now = deps.now ?? (() => new Date());
	}

	get enabled(): boolean {
		return this.deps.gateway !== null;
	}

	/** WhatsApp attaches itself once the session exists. */
	attachMessenger(messenger: CustomerMessenger): void {
		this.messenger = messenger;
	}

	/** Sends a Paynow prompt for the deposit or the balance. */
	async request(input: {
		customerId: string;
		kind: PaymentKind;
		method: PaymentMethod;
		phone: string;
	}): Promise<PaymentRequestResult> {
		const { crm, gateway } = this.deps;
		const customer = crm.get(input.customerId);
		if (!customer) {
			return { ok: false, reason: "unknown_customer" };
		}
		if (!gateway) {
			return { ok: false, reason: "not_configured" };
		}
		const blocked = this.blockedReason(customer, input.kind);
		if (blocked) {
			return { ok: false, reason: blocked };
		}
		const pending = crm.payments
			.pending()
			.find(
				(waiting) =>
					waiting.customerId === customer.id && waiting.kind === input.kind
			);
		if (pending?.status === "sent") {
			return {
				amountUsd: pending.amountUsd,
				instructions: pending.instructions,
				ok: true,
				reference: pending.reference,
				status: "already_pending",
			};
		}
		const amountUsd = this.amountFor(customer.id, input.kind);
		const payment = crm.payments.create({
			amountUsd,
			customerId: customer.id,
			kind: input.kind,
			method: input.method,
			phone: input.phone,
		});
		const result = await gateway.requestMobilePayment({
			amountUsd,
			description: KIND_LABELS[input.kind],
			method: input.method,
			phone: input.phone,
			reference: payment.reference,
		});
		if (!result.ok) {
			crm.payments.update(payment.id, {
				error: result.error,
				status: "failed",
			});
			crm.recordEvent(customer.id, "payment_failed", {
				error: result.error,
				kind: input.kind,
				reference: payment.reference,
			});
			return { error: result.error, ok: false, reason: "provider_error" };
		}
		crm.payments.update(payment.id, {
			instructions: result.instructions,
			paynowReference: result.paynowReference,
			pollUrl: result.pollUrl,
			status: "sent",
		});
		crm.recordEvent(customer.id, "payment_requested", {
			amountUsd,
			kind: input.kind,
			method: input.method,
			reference: payment.reference,
		});
		if (input.kind === "deposit") {
			crm.setStage(customer.id, "deposit_requested", {
				by: "system",
				reason: `Paynow ${input.method} prompt sent`,
			});
			await this.deps.meta.report({
				customerId: customer.id,
				eventName: "InitiateCheckout",
				valueUsd: amountUsd,
			});
		}
		this.watch(payment.id);
		return {
			amountUsd,
			instructions: result.instructions,
			ok: true,
			reference: payment.reference,
			status: "sent",
		};
	}

	/** Checks Paynow now and applies the result; returns the latest record. */
	async refresh(
		customerId: string,
		kind: PaymentKind
	): Promise<Payment | null> {
		const payment = this.deps.crm.payments.latest(customerId, kind);
		if (!payment) {
			return null;
		}
		if (payment.status === "sent" && payment.pollUrl && this.deps.gateway) {
			const status = await this.deps.gateway.poll(payment.pollUrl);
			if (status) {
				await this.apply(payment, status);
			}
		}
		return this.deps.crm.payments.byId(payment.id) ?? null;
	}

	/** A verified status update from Paynow's result URL. */
	async handleStatusUpdate(status: PaynowStatus): Promise<boolean> {
		const payment = status.reference
			? this.deps.crm.payments.byReference(status.reference)
			: undefined;
		if (!payment) {
			return false;
		}
		await this.apply(payment, status);
		return true;
	}

	/** Picks up payments that were waiting when the process stopped. */
	resumePending(): void {
		for (const payment of this.deps.crm.payments.pending()) {
			if (payment.status === "sent" && payment.pollUrl) {
				this.watch(payment.id);
			} else {
				this.deps.crm.payments.update(payment.id, {
					error: "Never sent to Paynow",
					status: "failed",
				});
			}
		}
	}

	stop(): void {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
	}

	private blockedReason(
		customer: Customer,
		kind: PaymentKind
	): "already_paid" | "deposit_not_paid" | "not_delivered" | null {
		const { payments } = this.deps.crm;
		if (payments.latest(customer.id, kind)?.status === "paid") {
			return "already_paid";
		}
		if (kind === "deposit") {
			return PAID_STAGES.includes(customer.stage) ? "already_paid" : null;
		}
		if (payments.latest(customer.id, "deposit")?.status !== "paid") {
			return "deposit_not_paid";
		}
		return customer.stage === "delivered" ? null : "not_delivered";
	}

	/** The balance matches what their deposit was the other half of. */
	private amountFor(customerId: string, kind: PaymentKind): number {
		const pricing = this.deps.pricing();
		if (kind === "deposit") {
			return pricing.depositUsd;
		}
		return (
			this.deps.crm.payments.latest(customerId, "deposit")?.amountUsd ??
			pricing.balanceUsd
		);
	}

	private watch(paymentId: number): void {
		const interval = this.deps.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
		const timeout = this.deps.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
		const tick = async () => {
			this.timers.delete(paymentId);
			const payment = this.deps.crm.payments.byId(paymentId);
			if (!(payment?.pollUrl && payment.status === "sent")) {
				return;
			}
			const age = this.now().getTime() - new Date(payment.createdAt).getTime();
			if (age > timeout) {
				await this.expire(payment);
				return;
			}
			const status = await this.deps.gateway?.poll(payment.pollUrl);
			if (status) {
				await this.apply(payment, status);
			}
			if (this.deps.crm.payments.byId(paymentId)?.status === "sent") {
				this.schedule(paymentId, tick, interval);
			}
		};
		this.schedule(paymentId, tick, interval);
	}

	private schedule(
		paymentId: number,
		tick: () => Promise<void>,
		delay: number
	): void {
		clearTimeout(this.timers.get(paymentId));
		const timer = setTimeout(() => {
			tick().catch(() => undefined);
		}, delay);
		timer.unref?.();
		this.timers.set(paymentId, timer);
	}

	private async apply(payment: Payment, status: PaynowStatus): Promise<void> {
		const { crm } = this.deps;
		const wrongAmount =
			status.amount !== null &&
			Math.abs(status.amount - payment.amountUsd) > 0.001;
		if (status.outcome === "paid" && wrongAmount) {
			const updated = crm.payments.update(payment.id, {
				error: `Paynow reported $${status.amount} instead of $${payment.amountUsd}`,
				providerStatus: status.providerStatus,
				status: "failed",
			});
			if (updated) {
				await this.alertOwner(
					`⚠️ Paynow reported a payment of $${status.amount} for ${payment.reference}, but we asked for ${usd(payment.amountUsd)}. Please check it in Paynow before confirming anything. Chat: https://wa.me/${payment.customerId}`
				);
			}
			return;
		}
		if (status.outcome === "pending") {
			crm.payments.update(payment.id, {
				providerStatus: status.providerStatus,
				status: "sent",
			});
			return;
		}
		const updated = crm.payments.update(payment.id, {
			paynowReference: status.paynowReference,
			providerStatus: status.providerStatus,
			status: status.outcome,
		});
		if (!updated) {
			return;
		}
		clearTimeout(this.timers.get(payment.id));
		this.timers.delete(payment.id);
		if (updated.status === "paid") {
			await this.onPaid(updated);
		} else {
			await this.onUnpaid(updated, paymentFailedMessage(updated));
		}
	}

	private async expire(payment: Payment): Promise<void> {
		const updated = this.deps.crm.payments.update(payment.id, {
			error: "The customer did not approve the prompt in time",
			status: "expired",
		});
		if (updated) {
			await this.onUnpaid(updated, paymentExpiredMessage(updated));
		}
	}

	private async onPaid(payment: Payment): Promise<void> {
		const { crm } = this.deps;
		const customer = crm.get(payment.customerId);
		if (!customer) {
			return;
		}
		crm.recordEvent(customer.id, "payment_paid", {
			amountUsd: payment.amountUsd,
			kind: payment.kind,
			reference: payment.reference,
		});
		crm.setStage(
			customer.id,
			payment.kind === "deposit" ? "deposit_paid" : "won",
			{ by: "system", reason: `Paynow ${payment.reference} paid` }
		);
		await this.tellCustomer(
			customer,
			payment.kind === "deposit"
				? depositPaidMessage(customer)
				: balancePaidMessage(customer)
		);
		await this.alertOwner(
			[
				`💰 *${payment.kind === "deposit" ? "Deposit" : "Balance"} paid: ${usd(payment.amountUsd)}*`,
				`${who(customer)} · ${customer.businessName ?? "business name unknown"}${customer.location ? ` · ${customer.location}` : ""}`,
				`Paynow ref: ${payment.paynowReference ?? "?"} (${payment.reference}, ${payment.method})`,
				payment.kind === "deposit"
					? `Angel sent them the materials checklist. The ${OFFER_TERMS.deliveryDays}-day clock starts once everything is in. Send #delivered ${customer.id} when the site is live.`
					: "The site is fully paid.",
				`Chat: https://wa.me/${customer.id}`,
			].join("\n")
		);
		await this.deps.meta.report({
			customerId: customer.id,
			eventName: "Purchase",
			key: payment.reference,
			valueUsd: payment.amountUsd,
		});
	}

	private async onUnpaid(payment: Payment, message: string): Promise<void> {
		const { crm } = this.deps;
		const customer = crm.get(payment.customerId);
		if (!customer) {
			return;
		}
		crm.recordEvent(customer.id, "payment_failed", {
			kind: payment.kind,
			reference: payment.reference,
			status: payment.status,
		});
		const recentFailures = crm.payments
			.forCustomer(customer.id, payment.kind)
			.slice(0, FAILURES_BEFORE_HANDOFF)
			.filter((item) => item.status !== "paid" && item.status !== "sent");
		if (recentFailures.length >= FAILURES_BEFORE_HANDOFF) {
			await this.tellCustomer(
				customer,
				"The payment still didn't go through, so I've asked a member of the team to help you sort it out here on WhatsApp."
			);
			await this.alertOwner(
				`⚠️ ${who(customer)}'s ${payment.kind} payment failed ${FAILURES_BEFORE_HANDOFF} times (last: ${payment.providerStatus ?? payment.status}). Please help them pay. Chat: https://wa.me/${customer.id}`
			);
			return;
		}
		await this.tellCustomer(customer, message);
	}

	private async tellCustomer(customer: Customer, text: string): Promise<void> {
		this.deps.crm.logMessage(customer.id, "out", text);
		this.deps.crm.touchOutbound(customer.id);
		try {
			await this.messenger?.sendToCustomer(customer.chatId, text);
		} catch {
			await this.alertOwner(
				`⚠️ Angel could not send this to ${who(customer)} (https://wa.me/${customer.id}):\n${text}`
			);
		}
	}

	private async alertOwner(text: string): Promise<void> {
		try {
			await this.deps.notifier.notifyOwner(text);
		} catch {
			// The CRM keeps the payment events; the owner sees them with #payments.
		}
	}
}
