import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { dealershipPricing } from "../knowledge/pricing.js";
import { MetaReporter } from "../meta/meta-reporter.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import {
	type PaymentGateway,
	PaymentService,
} from "../payments/payment.service.js";
import { CUSTOMER_ID_KEY, createAngelTools } from "./tools.js";

const ID = "263771234567";
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

const setup = (gateway: PaymentGateway | null = null) => {
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const crm = new CrmRepository(":memory:");
	opened.push(crm);
	crm.touchInbound({ chatId: `${ID}@c.us`, id: ID, text: "Hi" });
	const notifier = new ConsoleOwnerNotifier();
	const pricing = () =>
		dealershipPricing(
			{
				earlyPriceUsd: 250,
				earlySlots: 5,
				earlySlotsUsedOffset: 0,
				standardPriceUsd: 400,
			},
			crm.countPaidDealerships()
		);
	const meta = new MetaReporter(null, crm);
	const report = vi.spyOn(meta, "report");
	const payments = new PaymentService({
		crm,
		gateway,
		meta,
		notifier,
		pricing,
	});
	services.push(payments);
	const tools = createAngelTools({
		crm,
		demoUrl: "https://dealership-demo.wheretheyare.co.zw",
		knowledge: [],
		meta,
		notifier,
		payments,
		pricing,
		takeoverHours: 12,
	});
	const requestContext = new RequestContext();
	requestContext.set(CUSTOMER_ID_KEY, ID);
	const run = (name: keyof typeof tools, input: Record<string, unknown>) =>
		(tools[name] as Executable).execute?.(
			input as never,
			{ requestContext } as never
		) as Promise<Record<string, unknown>>;
	return { crm, notifier, report, run };
};

describe("sales tools", () => {
	it("gives the offer headline and keeps the other terms separate", async () => {
		const { run } = setup();
		const offer = await run("get_offer", {});
		expect(offer.headline).toContain("$250 instead of $400");
		expect(offer.terms).toMatchObject({
			hosting: expect.stringContaining("$15/month"),
			payment: expect.stringContaining("$125 deposit"),
		});
		expect(offer.foundingPlacesLeft).toContain("5 of 5");
	});

	it("scores the lead as details arrive and qualifies it once for Meta", async () => {
		const { crm, report, run } = setup();
		await run("save_customer_details", {
			businessName: "Tino Motors",
			businessType: "car_dealership",
			isDecisionMaker: "yes",
			stockSize: "about 30",
			timing: "this week",
		});
		expect(crm.get(ID)).toMatchObject({
			leadScore: 4,
			stage: "new",
			stockSize: "about 30",
			timing: "this week",
		});
		const result = await run("update_lead_signals", {
			priceWithinReach: true,
			wantsLiveWithin30Days: true,
		});
		expect(result).toMatchObject({ band: "close_now", score: 8 });
		expect(crm.get(ID)?.stage).toBe("qualified");
		expect(report).toHaveBeenCalledWith({
			customerId: ID,
			eventName: "QualifiedLead",
		});
	});

	it("checks the wallet number before asking Paynow", async () => {
		const { run } = setup();
		expect(
			await run("request_payment", { kind: "deposit", phone: "0731234567" })
		).toMatchObject({
			ok: false,
			tellCustomer: expect.stringContaining("EcoCash"),
		});
	});

	it("hands payment to the owner when Paynow is not set up", async () => {
		const { notifier, run } = setup();
		const result = await run("request_payment", {
			kind: "deposit",
			phone: "0771234567",
		});
		expect(result).toMatchObject({ ok: false, reason: "not_configured" });
		expect(notifier.sent.at(-1)).toContain("isn't set up");
	});

	it("sends a deposit prompt and reports its status", async () => {
		const gateway: PaymentGateway = {
			poll: () => Promise.resolve(null),
			requestMobilePayment: () =>
				Promise.resolve({
					instructions: null,
					ok: true,
					paynowReference: "1",
					pollUrl: "https://paynow.test/poll",
				}),
		};
		const { crm, run } = setup(gateway);
		const result = await run("request_payment", {
			kind: "deposit",
			phone: "0771234567",
		});
		expect(result).toMatchObject({ amountUsd: 125, ok: true });
		expect(result.tellCustomer).toContain("EcoCash prompt for $125");
		expect(crm.get(ID)?.stage).toBe("deposit_requested");
		expect(await run("check_payment", { kind: "deposit" })).toMatchObject({
			status: "sent",
		});
	});

	it("keeps a dealership's funnel stage when handing off", async () => {
		const { crm, notifier, run } = setup();
		crm.setStage(ID, "price_discussed", { by: "agent" });
		await run("request_human", {
			reason: "custom_feature",
			summary: "Wants online booking",
		});
		expect(crm.get(ID)?.stage).toBe("price_discussed");
		expect(notifier.sent.at(-1)).toContain("Score: 0/10");
	});
});
