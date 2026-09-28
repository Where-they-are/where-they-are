import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { socialMediaOffer } from "../knowledge/offer.js";
import { MetaReporter } from "../meta/meta-reporter.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import {
	type PaymentGateway,
	PaymentService,
} from "../payments/payment.service.js";
import { PAYMENT_LINK_KEY } from "./payment-tools.js";
import { CUSTOMER_ID_KEY, createAngelTools } from "./tools.js";

const ID = "263771234567";
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
	vi.restoreAllMocks();
});

interface Executable {
	execute?: (input: never, context: never) => Promise<unknown>;
}

const gateway = (): PaymentGateway => ({
	poll: vi.fn(() => Promise.resolve(null)),
	requestMobilePayment: vi.fn(() =>
		Promise.resolve({
			instructions: "Dial *151#",
			ok: true as const,
			paynowReference: "1",
			pollUrl: "https://paynow.test/poll",
		})
	),
	requestPaymentLink: vi.fn(() =>
		Promise.resolve({
			link: LINK,
			ok: true as const,
			pollUrl: "https://paynow.test/poll",
		})
	),
});

const setup = (paynow: PaymentGateway | null = gateway()) => {
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const crm = new CrmRepository(":memory:");
	opened.push(crm);
	crm.touchInbound({ chatId: `${ID}@c.us`, id: ID, text: "Hi" });
	const notifier = new ConsoleOwnerNotifier();
	const offer = () =>
		socialMediaOffer(
			{ launchPlaces: 5, launchPlacesUsedOffset: 0 },
			crm.countLaunchClients()
		);
	const meta = new MetaReporter(null, crm);
	const payments = new PaymentService({
		crm,
		gateway: paynow,
		meta,
		notifier,
		offer,
	});
	services.push(payments);
	const tools = createAngelTools({
		crm,
		examplesUrl: "",
		knowledge: [],
		meta,
		notifier,
		offer,
		payments,
		takeoverHours: 12,
	});
	const requestContext = new RequestContext();
	requestContext.set(CUSTOMER_ID_KEY, ID);
	const run = (name: keyof typeof tools, input: Record<string, unknown>) =>
		(tools[name] as Executable).execute?.(
			input as never,
			{ requestContext } as never
		) as Promise<Record<string, unknown>>;
	return { crm, payments, requestContext, run };
};

describe("payment tools", () => {
	it("sends an EcoCash prompt to the chat's number at the launch price", async () => {
		const { crm, run } = setup();
		const result = await run("request_payment", {
			method: "ecocash",
			plan: "growth",
		});
		expect(result).toMatchObject({ amount: "$48", sent: true });
		expect(result.guidance).toContain("0771234567");
		expect(result.guidance).toContain("never by sending it to us");
		expect(crm.payments.latest(ID, "first_month")).toMatchObject({
			method: "ecocash",
			phone: ID,
			status: "sent",
		});
		// Asking to pay means the price works for them.
		expect(crm.get(ID)?.leadSignals.priceWithinReach).toBe(true);
	});

	it("creates a Paynow link and marks it for the reply", async () => {
		const { requestContext, run } = setup();
		const result = await run("request_payment", {
			method: "link",
			plan: "pro",
		});
		expect(result).toMatchObject({ amount: "$120", link: LINK, sent: true });
		expect(requestContext.get(PAYMENT_LINK_KEY)).toBe(LINK);
	});

	it("asks for a proper wallet number instead of sending a prompt", async () => {
		const { crm, run } = setup();
		const result = await run("request_payment", {
			method: "onemoney",
			plan: "starter",
			walletNumber: "12345",
		});
		expect(result.sent).toBe(false);
		expect(result.guidance).toContain("OneMoney (071)");
		expect(crm.payments.forCustomer(ID)).toEqual([]);
	});

	it("hands the close to the owner when Paynow is not set up", async () => {
		const { run } = setup(null);
		const result = await run("request_payment", {
			method: "link",
			plan: "growth",
		});
		expect(result.sent).toBe(false);
		expect(result.guidance).toContain("ready_to_start");
	});

	it("reports payment status only from Paynow", async () => {
		const { payments, run } = setup();
		expect(await run("check_payment", {})).toMatchObject({ status: "none" });
		const request = await run("request_payment", {
			method: "link",
			plan: "growth",
		});
		expect(request.sent).toBe(true);
		expect(await run("check_payment", {})).toMatchObject({
			link: LINK,
			status: "waiting",
		});
		const payment = await payments.refresh(ID);
		await payments.handleStatusUpdate({
			amount: 48,
			outcome: "paid",
			paynowReference: "1",
			pollUrl: null,
			providerStatus: "Paid",
			reference: payment?.reference ?? "",
		});
		expect(await run("check_payment", {})).toMatchObject({ status: "paid" });
	});
});
