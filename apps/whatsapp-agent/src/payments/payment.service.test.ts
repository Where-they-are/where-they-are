import type { PaynowStatus } from "@where-they-are/paynow";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { socialMediaOffer } from "../knowledge/offer.js";
import { MetaReporter } from "../meta/meta-reporter.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import { type PaymentGateway, PaymentService } from "./payment.service.js";

const ID = "263771234567";
const POLL_URL = "https://www.paynow.co.zw/interface/poll?guid=abc";
const LINK = "https://www.paynow.co.zw/Payment/ConfirmPayment/1";
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
	amount: number | null = null
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
		location: "Mutare",
		name: "Tino Moyo",
	});
	const notifier = new ConsoleOwnerNotifier();
	const pollStatuses: string[] = [];
	const gateway: PaymentGateway = {
		poll: vi.fn(() => {
			const next = pollStatuses.shift();
			const [payment] = crm.payments.forCustomer(ID);
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
		requestPaymentLink: vi.fn(() =>
			Promise.resolve({ link: LINK, ok: true as const, pollUrl: POLL_URL })
		),
	};
	const sent: { chatId: string; text: string }[] = [];
	const service = new PaymentService({
		crm,
		gateway: options.gateway === undefined ? gateway : options.gateway,
		linkWatchMs: 60_000,
		meta: new MetaReporter(null, crm),
		notifier,
		offer: () =>
			socialMediaOffer(
				{ launchPlaces: 5, launchPlacesUsedOffset: 0 },
				crm.countLaunchClients()
			),
		pollIntervalMs: 1000,
		promptTimeoutMs: 5000,
	});
	services.push(service);
	service.attachMessenger({
		sendToCustomer: (chatId, text) => {
			sent.push({ chatId, text });
			return Promise.resolve();
		},
	});
	const payByEcoCash = () =>
		service.request({
			customerId: ID,
			kind: "first_month",
			method: "ecocash",
			phone: "0771111111",
			plan: "growth",
		});
	const payByLink = () =>
		service.request({
			customerId: ID,
			kind: "first_month",
			method: "link",
			plan: "growth",
		});
	return {
		crm,
		gateway,
		notifier,
		payByEcoCash,
		payByLink,
		pollStatuses,
		sent,
		service,
	};
};

const referenceOf = (result: { ok: boolean; reference?: string }) =>
	result.reference ?? "";

describe("PaymentService first month", () => {
	it("sends a mobile prompt at the launch price", async () => {
		const { crm, gateway, payByEcoCash } = setup();
		expect(await payByEcoCash()).toEqual({
			amountUsd: 48,
			instructions: "Approve the prompt on your phone",
			link: null,
			ok: true,
			plan: "growth",
			reference: `WTA-${ID}-FM-1`,
			status: "sent",
		});
		expect(gateway.requestMobilePayment).toHaveBeenCalledWith(
			expect.objectContaining({
				amountUsd: 48,
				description: "Where They Are Growth Plan, first month",
				method: "ecocash",
			})
		);
		expect(crm.get(ID)).toMatchObject({
			recommendedPlan: "growth",
			stage: "ready_to_start",
		});
	});

	it("creates a Paynow link and reuses it while it is open", async () => {
		const { crm, gateway, payByLink } = setup();
		const first = await payByLink();
		expect(first).toMatchObject({ link: LINK, ok: true, status: "sent" });
		expect(crm.payments.latest(ID, "first_month")).toMatchObject({
			link: LINK,
			method: "link",
			phone: ID,
		});
		expect(await payByLink()).toMatchObject({
			link: LINK,
			status: "already_pending",
		});
		expect(gateway.requestPaymentLink).toHaveBeenCalledTimes(1);
	});

	it("makes a paid first month a client once: stage, plan, checklist, owner alert", async () => {
		const { crm, notifier, payByLink, sent, service } = setup();
		const reference = referenceOf(await payByLink());
		await service.handleStatusUpdate(status(reference, "Paid", 48));
		await service.handleStatusUpdate(status(reference, "Paid", 48));
		expect(crm.get(ID)).toMatchObject({
			plan: "growth",
			stage: "paying_client",
		});
		expect(sent).toHaveLength(1);
		expect(sent[0]?.chatId).toBe(`${ID}@c.us`);
		expect(sent[0]?.text).toContain("Payment received, thank you Tino!");
		expect(sent[0]?.text).toContain("photos and details of the vehicles");
		expect(
			notifier.sent.filter((alert) => alert.includes("New client"))
		).toHaveLength(1);
		expect(crm.countLaunchClients()).toBe(1);
		expect(crm.messages(ID).at(-1)?.body).toContain("Payment received");
	});

	it("finds out about payment by polling when no result URL call arrives", async () => {
		vi.useFakeTimers();
		const { crm, payByEcoCash, pollStatuses, sent } = setup();
		pollStatuses.push("Sent", "Paid");
		await payByEcoCash();
		await vi.advanceTimersByTimeAsync(1000);
		expect(crm.payments.latest(ID, "first_month")?.status).toBe("sent");
		await vi.advanceTimersByTimeAsync(1000);
		expect(crm.payments.latest(ID, "first_month")?.status).toBe("paid");
		expect(sent).toHaveLength(1);
	});

	it("offers to retry a cancelled payment, then hands off after two failures", async () => {
		const { notifier, payByEcoCash, sent, service } = setup();
		await service.handleStatusUpdate(
			status(referenceOf(await payByEcoCash()), "Cancelled")
		);
		expect(sent.at(-1)?.text).toContain("Would you like me to send it again?");
		await service.handleStatusUpdate(
			status(referenceOf(await payByEcoCash()), "Cancelled")
		);
		expect(sent.at(-1)?.text).toContain("asked a member of our team");
		expect(notifier.sent.at(-1)).toContain("failed 2 times");
	});

	it("expires an unapproved prompt but keeps a link open for the result URL", async () => {
		vi.useFakeTimers();
		const { crm, payByEcoCash, payByLink, sent } = setup();
		await payByEcoCash();
		await payByLink();
		await vi.advanceTimersByTimeAsync(7000);
		const [link, prompt] = crm.payments.forCustomer(ID);
		expect(prompt?.status).toBe("expired");
		expect(link?.status).toBe("sent");
		expect(sent.at(-1)?.text).toContain("expired");
	});

	it("never confirms a payment for the wrong amount", async () => {
		const { crm, notifier, payByEcoCash, sent, service } = setup();
		await service.handleStatusUpdate(
			status(referenceOf(await payByEcoCash()), "Paid", 1)
		);
		expect(crm.get(ID)?.stage).toBe("ready_to_start");
		expect(sent).toEqual([]);
		expect(notifier.sent.at(-1)).toContain("Please check it in Paynow");
	});

	it("flags a second paid first month instead of signing them twice", async () => {
		const { notifier, payByEcoCash, payByLink, sent, service } = setup();
		const prompt = referenceOf(await payByEcoCash());
		const link = referenceOf(await payByLink());
		await service.handleStatusUpdate(status(prompt, "Paid"));
		await service.handleStatusUpdate(status(link, "Paid"));
		expect(sent).toHaveLength(1);
		expect(notifier.sent.at(-1)).toContain("paid their first month twice");
	});

	it("refuses a client's first month again and hands off when Paynow is not set up", async () => {
		const paid = setup();
		await paid.service.handleStatusUpdate(
			status(referenceOf(await paid.payByLink()), "Paid")
		);
		expect(await paid.payByEcoCash()).toEqual({
			ok: false,
			reason: "already_client",
		});
		const unconfigured = setup({ gateway: null });
		expect(await unconfigured.payByEcoCash()).toEqual({
			ok: false,
			reason: "not_configured",
		});
	});

	it("records Paynow's error when the request is rejected", async () => {
		const { crm, gateway, payByEcoCash } = setup();
		vi.mocked(gateway.requestMobilePayment).mockResolvedValueOnce({
			error: "Invalid mobile number",
			ok: false,
		});
		expect(await payByEcoCash()).toEqual({
			error: "Invalid mobile number",
			ok: false,
			reason: "provider_error",
		});
		expect(crm.payments.latest(ID, "first_month")?.status).toBe("failed");
	});
});

describe("PaymentService renewals", () => {
	it("bills only clients, at the full price, and marks them renewed", async () => {
		const { crm, payByLink, sent, service } = setup();
		const renew = () =>
			service.request({
				customerId: ID,
				kind: "renewal",
				method: "link",
				plan: "growth",
			});
		expect(await renew()).toEqual({ ok: false, reason: "not_a_client" });
		await service.handleStatusUpdate(
			status(referenceOf(await payByLink()), "Paid")
		);
		const request = await renew();
		expect(request).toMatchObject({
			amountUsd: 96,
			ok: true,
			reference: `WTA-${ID}-RN-1`,
		});
		await service.handleStatusUpdate(status(referenceOf(request), "Paid"));
		expect(crm.get(ID)?.stage).toBe("renewed");
		expect(sent.at(-1)?.text).toContain("continues for another month");
	});
});

describe("PaymentService restarts", () => {
	it("resumes waiting payments and fails ones never sent", () => {
		const { crm, service } = setup();
		const unsent = crm.payments.create({
			amountUsd: 48,
			customerId: ID,
			kind: "first_month",
			method: "ecocash",
			phone: "263771111111",
			plan: "growth",
		});
		service.resumePending();
		expect(crm.payments.byId(unsent.id)?.status).toBe("failed");
	});
});
