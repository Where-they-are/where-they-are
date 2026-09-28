import type {
	MobilePaymentRequest,
	MobilePaymentResult,
	PaymentLinkRequest,
	PaymentLinkResult,
	PaynowStatus,
} from "@where-they-are/paynow";

import type { CrmRepository } from "../crm/crm.repository.js";
import {
	type Customer,
	PAID_STAGES,
	type Payment,
	type PaymentMethod,
} from "../crm/crm.types.js";
import {
	PLANS,
	type PlanId,
	type SocialMediaOffer,
	usd,
} from "../knowledge/offer.js";
import type { MetaReporter } from "../meta/meta-reporter.js";
import type { OwnerNotifier } from "../notifications/owner-notifier.js";
import {
	firstMonthPaidMessage,
	paymentExpiredMessage,
	paymentFailedMessage,
	paymentHandedOverMessage,
	renewalPaidMessage,
} from "./payment-messages.js";

/** The Paynow calls the service needs; PaynowClient implements it. */
export interface PaymentGateway {
	poll: (pollUrl: string) => Promise<PaynowStatus | null>;
	requestMobilePayment: (
		request: MobilePaymentRequest
	) => Promise<MobilePaymentResult>;
	requestPaymentLink: (
		request: PaymentLinkRequest
	) => Promise<PaymentLinkResult>;
}

/** Sends a message into a customer's WhatsApp chat outside a reply turn. */
export interface CustomerMessenger {
	sendToCustomer: (chatId: string, text: string) => Promise<void>;
}

/** Plan payments Angel or the owner can request. */
export type PlanPaymentKind = "first_month" | "renewal";

export type PaymentRequestResult =
	| {
			amountUsd: number;
			instructions: string | null;
			link: string | null;
			ok: true;
			plan: PlanId;
			reference: string;
			status: "sent" | "already_pending";
	  }
	| {
			error?: string;
			ok: false;
			reason:
				| "not_configured"
				| "unknown_customer"
				| "already_client"
				| "not_a_client"
				| "provider_error";
	  };

export interface PaymentServiceDeps {
	crm: CrmRepository;
	/** Null when Paynow is not configured: requests are handed to the owner. */
	gateway: PaymentGateway | null;
	/** How long a payment link keeps being polled; the result URL still counts after. */
	linkWatchMs?: number;
	meta: MetaReporter;
	notifier: OwnerNotifier;
	now?: () => Date;
	offer: () => SocialMediaOffer;
	pollIntervalMs?: number;
	/** How long a customer has to approve a mobile prompt before it expires. */
	promptTimeoutMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 10_000;
/** Links are checked less often once the first few minutes have passed. */
const SLOW_POLL_FACTOR = 12;
const FAST_POLL_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_PROMPT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_LINK_WATCH_MS = 24 * 60 * 60 * 1000;
/** A failed attempt this many times in a row goes to the owner. */
const FAILURES_BEFORE_HANDOFF = 2;
const AMOUNT_TOLERANCE = 0.001;

const who = (customer: Customer) =>
	customer.name ?? customer.displayName ?? customer.id;

const describePayment = (kind: PlanPaymentKind, plan: PlanId): string =>
	`Where They Are ${PLANS[plan].name}, ${kind === "first_month" ? "first month" : "monthly renewal"}`;

/**
 * Takes plan payments with Paynow: a USSD prompt on an EcoCash or OneMoney
 * wallet, or a Paynow link for card and bank. A payment only counts once
 * Paynow reports it paid, through the result URL or by polling, and each
 * outcome is acted on exactly once.
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

	/**
	 * Requests a plan payment. The first month is priced from the live offer
	 * (launch price while places last); a renewal is the plan's full price
	 * unless the owner gives an amount.
	 */
	async request(input: {
		amountUsd?: number;
		customerId: string;
		kind: PlanPaymentKind;
		method: PaymentMethod;
		/** Wallet number for a mobile prompt; ignored for a link. */
		phone?: string;
		plan: PlanId;
	}): Promise<PaymentRequestResult> {
		const { crm, gateway } = this.deps;
		const customer = crm.get(input.customerId);
		if (!customer) {
			return { ok: false, reason: "unknown_customer" };
		}
		if (!gateway) {
			return { ok: false, reason: "not_configured" };
		}
		const isClient = PAID_STAGES.includes(customer.stage);
		if (input.kind === "first_month" && isClient) {
			return { ok: false, reason: "already_client" };
		}
		if (input.kind === "renewal" && !isClient) {
			return { ok: false, reason: "not_a_client" };
		}
		const phone =
			input.method === "link" ? customer.id : (input.phone ?? customer.id);
		const pending = this.reusable(customer.id, input.kind, input.method, phone);
		if (pending) {
			return {
				amountUsd: pending.amountUsd,
				instructions: pending.instructions,
				link: pending.link,
				ok: true,
				plan: pending.plan ?? input.plan,
				reference: pending.reference,
				status: "already_pending",
			};
		}
		const amountUsd =
			input.amountUsd ??
			(input.kind === "first_month"
				? this.deps.offer().plans[input.plan].firstMonthUsd
				: PLANS[input.plan].priceUsd);
		const payment = crm.payments.create({
			amountUsd,
			customerId: customer.id,
			kind: input.kind,
			method: input.method,
			phone,
			plan: input.plan,
		});
		const sent = await this.send(payment, input.kind, input.plan);
		if (!sent.ok) {
			crm.payments.update(payment.id, { error: sent.error, status: "failed" });
			crm.recordEvent(customer.id, "payment_failed", {
				error: sent.error,
				kind: input.kind,
				reference: payment.reference,
			});
			return { error: sent.error, ok: false, reason: "provider_error" };
		}
		crm.payments.update(payment.id, {
			instructions: sent.instructions,
			link: sent.link,
			paynowReference: sent.paynowReference,
			pollUrl: sent.pollUrl,
			status: "sent",
		});
		crm.recordEvent(customer.id, "payment_requested", {
			amountUsd,
			kind: input.kind,
			method: input.method,
			plan: input.plan,
			reference: payment.reference,
		});
		if (input.kind === "first_month") {
			crm.setPlan(customer.id, "recommended", input.plan);
			crm.setStage(customer.id, "ready_to_start", {
				by: "system",
				reason: `Paynow ${input.method} payment requested`,
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
			instructions: sent.instructions,
			link: sent.link,
			ok: true,
			plan: input.plan,
			reference: payment.reference,
			status: "sent",
		};
	}

	/** Checks Paynow now and applies the result; returns the latest record. */
	async refresh(
		customerId: string,
		kind: PlanPaymentKind = "first_month"
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

	/** Sends a message into a customer's chat and logs it, e.g. for an owner command. */
	async messageCustomer(customerId: string, text: string): Promise<boolean> {
		const customer = this.deps.crm.get(customerId);
		if (!customer) {
			return false;
		}
		await this.tellCustomer(customer, text);
		return true;
	}

	stop(): void {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
	}

	/** A request still waiting on the same wallet or link, so we never send duplicates. */
	private reusable(
		customerId: string,
		kind: PlanPaymentKind,
		method: PaymentMethod,
		phone: string
	): Payment | undefined {
		const linkWatch = this.deps.linkWatchMs ?? DEFAULT_LINK_WATCH_MS;
		return this.deps.crm.payments
			.pending()
			.find(
				(waiting) =>
					waiting.customerId === customerId &&
					waiting.kind === kind &&
					waiting.status === "sent" &&
					waiting.method === method &&
					waiting.phone === phone &&
					(method !== "link" || this.ageOf(waiting) < linkWatch)
			);
	}

	private async send(
		payment: Payment,
		kind: PlanPaymentKind,
		plan: PlanId
	): Promise<
		| {
				instructions: string | null;
				link: string | null;
				ok: true;
				paynowReference: string | null;
				pollUrl: string;
		  }
		| { error: string; ok: false }
	> {
		const gateway = this.deps.gateway as PaymentGateway;
		const description = describePayment(kind, plan);
		if (payment.method === "link") {
			const result = await gateway.requestPaymentLink({
				amountUsd: payment.amountUsd,
				description,
				reference: payment.reference,
			});
			return result.ok
				? {
						instructions: null,
						link: result.link,
						ok: true,
						paynowReference: null,
						pollUrl: result.pollUrl,
					}
				: result;
		}
		const result = await gateway.requestMobilePayment({
			amountUsd: payment.amountUsd,
			description,
			method: payment.method,
			phone: payment.phone,
			reference: payment.reference,
		});
		return result.ok ? { ...result, link: null } : result;
	}

	private ageOf(payment: Payment): number {
		return this.now().getTime() - new Date(payment.createdAt).getTime();
	}

	private watch(paymentId: number): void {
		const interval = this.deps.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
		const promptTimeout =
			this.deps.promptTimeoutMs ?? DEFAULT_PROMPT_TIMEOUT_MS;
		const linkWatch = this.deps.linkWatchMs ?? DEFAULT_LINK_WATCH_MS;
		const tick = async () => {
			this.timers.delete(paymentId);
			const payment = this.deps.crm.payments.byId(paymentId);
			if (!(payment?.pollUrl && payment.status === "sent")) {
				return;
			}
			const age = this.ageOf(payment);
			const isLink = payment.method === "link";
			if (!isLink && age > promptTimeout) {
				await this.expire(payment);
				return;
			}
			const status = await this.deps.gateway?.poll(payment.pollUrl);
			if (status) {
				await this.apply(payment, status);
			}
			// A link stays open after we stop polling: Paynow's result URL and
			// check_payment still confirm it.
			if (isLink && age > linkWatch) {
				return;
			}
			if (this.deps.crm.payments.byId(paymentId)?.status === "sent") {
				const slow = isLink && age > FAST_POLL_WINDOW_MS;
				this.schedule(
					paymentId,
					tick,
					slow ? interval * SLOW_POLL_FACTOR : interval
				);
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
			Math.abs(status.amount - payment.amountUsd) > AMOUNT_TOLERANCE;
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
			plan: payment.plan,
			reference: payment.reference,
		});
		const paidTwice =
			payment.kind === "first_month" &&
			crm.payments
				.forCustomer(customer.id, "first_month")
				.some((other) => other.id !== payment.id && other.status === "paid");
		if (paidTwice) {
			await this.alertOwner(
				`⚠️ ${who(customer)} paid their first month twice (${payment.reference}, ${usd(payment.amountUsd)}). Please refund or credit the second payment in Paynow. Chat: https://wa.me/${customer.id}`
			);
			return;
		}
		if (payment.kind === "first_month") {
			await this.onFirstMonthPaid(customer, payment);
		} else {
			await this.onRenewalPaid(customer, payment);
		}
	}

	private async onFirstMonthPaid(
		customer: Customer,
		payment: Payment
	): Promise<void> {
		const { crm } = this.deps;
		const plan = payment.plan ?? customer.recommendedPlan ?? "growth";
		crm.setPlan(customer.id, "paying", plan);
		crm.setStage(customer.id, "paying_client", {
			by: "system",
			reason: `Paynow ${payment.reference} paid`,
		});
		crm.recordEvent(customer.id, "client_signed", {
			amountUsd: payment.amountUsd,
			by: "paynow",
			plan,
		});
		await this.tellCustomer(customer, firstMonthPaidMessage(customer, payment));
		await this.alertOwner(
			[
				`💰 *New client: ${usd(payment.amountUsd)} paid for the ${PLANS[plan].name}*`,
				`${who(customer)} · ${customer.businessName ?? "dealership name unknown"}${customer.location ? ` · ${customer.location}` : ""}`,
				`Paynow ref: ${payment.paynowReference ?? "?"} (${payment.reference}, ${payment.method})`,
				"Angel sent them the onboarding checklist. Please follow up on page access and their first posts.",
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

	private async onRenewalPaid(
		customer: Customer,
		payment: Payment
	): Promise<void> {
		this.deps.crm.setStage(customer.id, "renewed", {
			by: "system",
			reason: `Paynow ${payment.reference} paid`,
		});
		await this.tellCustomer(customer, renewalPaidMessage(customer, payment));
		await this.alertOwner(
			`💰 Renewal paid: ${usd(payment.amountUsd)} from ${who(customer)} (${payment.reference}, ${payment.method}). Chat: https://wa.me/${customer.id}`
		);
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
			await this.tellCustomer(customer, paymentHandedOverMessage);
			await this.alertOwner(
				`⚠️ ${who(customer)}'s payment failed ${FAILURES_BEFORE_HANDOFF} times (last: ${payment.providerStatus ?? payment.status}). Please help them pay. Chat: https://wa.me/${customer.id}`
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
			// The CRM keeps the payment events; the owner sees them with #lead.
		}
	}
}
