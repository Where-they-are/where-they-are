import type { PaynowStatus } from "@where-they-are/paynow";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { dealershipPricing } from "../knowledge/pricing.js";
import { MetaReporter } from "../meta/meta-reporter.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import { type PaymentGateway, PaymentService } from "./payment.service.js";

const ID = "263771234567";
const POLL_URL = "https://www.paynow.co.zw/interface/poll?guid=abc";
const opened: CrmRepository[] = [];
const services: PaymentService[] = [];

afterEach(() => {
	for (const service of services.splice(0)) {
		service.stop();
	}
	for (const repo of opened.splice(0)) {
		repo.close();
	}
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const OUTCOMES: Record<string, PaynowStatus["outcome"]> = {
	Cancelled: "cancelled",
	Paid: "paid",
};

const status = (
	reference: string,
	providerStatus: string,
	amount = 125
): PaynowStatus => ({
	amount,
	outcome: OUTCOMES[providerStatus] ?? "pending",
	paynowReference: "987",
	pollUrl: POLL_URL,
	providerStatus,
	reference,
});

const setup = (options: { gateway?: PaymentGateway | null } = {}) => {
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const crm = new CrmRepository(":memory:");
	opened.push(crm);
	crm.touchInbound({ chatId: `${ID}@c.us`, id: ID, text: "Hi" });
	crm.updateProfile(ID, {
		businessName: "Tino Motors",
		businessType: "car_dealership",
		name: "Tino Moyo",
	});
	const notifier = new ConsoleOwnerNotifier();
	const pollStatuses: string[] = [];
	const gateway: PaymentGateway = {
		poll: vi.fn(() => {
			const next = pollStatuses.shift();
			const payment = crm.payments.latest(ID, "deposit");
			return Promise.resolve(
				next && payment ? status(payment.reference, next) : null
			);
		}),
		requestMobilePayment: vi.fn(() =>
			Promise.resolve({
				instructions: "Approve the prompt on your phone",
				ok: true as const,
				paynowReference: "987",
				pollUrl: POLL_URL,
			})
		),
	};
	const sent: { chatId: string; text: string }[] = [];
	const service = new PaymentService({
		crm,
		gateway: options.gateway === undefined ? gateway : options.gateway,
		meta: new MetaReporter(null, crm),
		notifier,
		pollIntervalMs: 1000,
		pollTimeoutMs: 5000,
		pricing: () =>
			dealershipPricing(
				{
					earlyPriceUsd: 250,
					earlySlots: 5,
					earlySlotsUsedOffset: 0,
					standardPriceUsd: 400,
				},
				crm.countPaidDealerships()
			),
	});
	services.push(service);
	service.attachMessenger({
		sendToCustomer: (chatId, text) => {
			sent.push({ chatId, text });
			return Promise.resolve();
		},
	});
	const requestDeposit = () =>
		service.request({
			customerId: ID,
			kind: "deposit",
			method: "ecocash",
			phone: "0771111111",
		});
	return {
		crm,
		gateway,
		notifier,
		pollStatuses,
		requestDeposit,
		sent,
		service,
	};
};

describe("PaymentService deposits", () => {
	it("sends a Paynow prompt for the founding deposit", async () => {
		const { crm, gateway, requestDeposit } = setup();
		expect(await requestDeposit()).toEqual({
			amountUsd: 125,
			instructions: "Approve the prompt on your phone",
			ok: true,
			reference: `WTA-${ID}-DEP-1`,
			status: "sent",
		});
		expect(gateway.requestMobilePayment).toHaveBeenCalledWith(
			expect.objectContaining({ amountUsd: 125, method: "ecocash" })
		);
		expect(crm.get(ID)?.stage).toBe("deposit_requested");
	});

	it("does not send a second prompt while one is waiting", async () => {
		const { gateway, requestDeposit } = setup();
		await requestDeposit();
		expect(await requestDeposit()).toMatchObject({
			ok: true,
			status: "already_pending",
		});
		expect(gateway.requestMobilePayment).toHaveBeenCalledTimes(1);
	});

	it("confirms a paid deposit once: stage, checklist, owner alert", async () => {
		const { crm, notifier, requestDeposit, sent, service } = setup();
		const request = await requestDeposit();
		const reference = request.ok ? request.reference : "";
		await service.handleStatusUpdate(status(reference, "Paid"));
		await service.handleStatusUpdate(status(reference, "Paid"));
		expect(crm.get(ID)?.stage).toBe("deposit_paid");
		expect(sent).toHaveLength(1);
		expect(sent[0]?.chatId).toBe(`${ID}@c.us`);
		expect(sent[0]?.text).toContain("Payment received, thank you Tino!");
		expect(sent[0]?.text).toContain("ready within 3 days");
		expect(
			notifier.sent.filter((alert) => alert.includes("Deposit paid"))
		).toHaveLength(1);
		expect(crm.messages(ID).at(-1)?.body).toContain("Payment received");
		expect(crm.countPaidDealerships()).toBe(1);
	});

	it("finds out about payment by polling when no result URL call arrives", async () => {
		vi.useFakeTimers();
		const { crm, pollStatuses, requestDeposit, sent } = setup();
		pollStatuses.push("Sent", "Paid");
		await requestDeposit();
		await vi.advanceTimersByTimeAsync(1000);
		expect(crm.payments.latest(ID, "deposit")?.status).toBe("sent");
		await vi.advanceTimersByTimeAsync(1000);
		expect(crm.payments.latest(ID, "deposit")?.status).toBe("paid");
		expect(sent).toHaveLength(1);
	});

	it("offers to retry a cancelled payment, then hands off after two failures", async () => {
		const { crm, notifier, requestDeposit, sent, service } = setup();
		const first = await requestDeposit();
		await service.handleStatusUpdate(
			status(first.ok ? first.reference : "", "Cancelled")
		);
		expect(sent.at(-1)?.text).toContain("Would you like me to send it again?");
		expect(crm.get(ID)?.stage).toBe("deposit_requested");
		const second = await requestDeposit();
		await service.handleStatusUpdate(
			status(second.ok ? second.reference : "", "Cancelled")
		);
		expect(sent.at(-1)?.text).toContain("asked a member of the team");
		expect(notifier.sent.at(-1)).toContain("failed 2 times");
	});

	it("expires a prompt the customer never approves", async () => {
		vi.useFakeTimers();
		const { crm, requestDeposit, sent } = setup();
		await requestDeposit();
		await vi.advanceTimersByTimeAsync(7000);
		expect(crm.payments.latest(ID, "deposit")?.status).toBe("expired");
		expect(sent.at(-1)?.text).toContain("expired");
	});

	it("never confirms a payment for the wrong amount", async () => {
		const { crm, notifier, requestDeposit, sent, service } = setup();
		const request = await requestDeposit();
		await service.handleStatusUpdate(
			status(request.ok ? request.reference : "", "Paid", 1)
		);
		expect(crm.get(ID)?.stage).toBe("deposit_requested");
		expect(sent).toEqual([]);
		expect(notifier.sent.at(-1)).toContain("Please check it in Paynow");
	});

	it("refuses a second deposit and hands off when Paynow is not set up", async () => {
		const paid = setup();
		const request = await paid.requestDeposit();
		await paid.service.handleStatusUpdate(
			status(request.ok ? request.reference : "", "Paid")
		);
		expect(await paid.requestDeposit()).toEqual({
			ok: false,
			reason: "already_paid",
		});
		const unconfigured = setup({ gateway: null });
		expect(await unconfigured.requestDeposit()).toEqual({
			ok: false,
			reason: "not_configured",
		});
	});
});

describe("PaymentService balances", () => {
	it("only takes the balance after delivery, then marks the deal won", async () => {
		const { crm, requestDeposit, sent, service } = setup();
		const balance = () =>
			service.request({
				customerId: ID,
				kind: "balance",
				method: "ecocash",
				phone: "0771111111",
			});
		expect(await balance()).toEqual({ ok: false, reason: "deposit_not_paid" });
		const deposit = await requestDeposit();
		await service.handleStatusUpdate(
			status(deposit.ok ? deposit.reference : "", "Paid")
		);
		expect(await balance()).toEqual({ ok: false, reason: "not_delivered" });
		crm.setStage(ID, "delivered", { by: "owner" });
		const request = await balance();
		expect(request).toMatchObject({ amountUsd: 125, ok: true });
		await service.handleStatusUpdate(
			status(request.ok ? request.reference : "", "Paid")
		);
		expect(crm.get(ID)?.stage).toBe("won");
		expect(sent.at(-1)?.text).toContain("fully paid");
	});
});
