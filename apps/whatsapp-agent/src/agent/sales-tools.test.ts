import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { dealershipPricing } from "../knowledge/pricing.js";
import { MetaReporter } from "../meta/meta-reporter.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import { CUSTOMER_ID_KEY, createAngelTools } from "./tools.js";

const ID = "263771234567";
const opened: CrmRepository[] = [];
afterEach(() => {
	for (const repo of opened.splice(0)) {
		repo.close();
	}
	vi.restoreAllMocks();
});

interface Executable {
	execute?: (input: never, context: never) => Promise<unknown>;
}

const setup = () => {
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
	const tools = createAngelTools({
		crm,
		demoUrl: "https://dealership-demo.wheretheyare.co.zw",
		knowledge: [],
		meta,
		notifier,
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
	it("scores the lead as details arrive and qualifies it once for Meta", async () => {
		const { crm, report, run } = setup();
		await run("save_customer_details", {
			businessName: "Tino Motors",
			businessType: "car_dealership",
			isDecisionMaker: "yes",
		});
		expect(crm.get(ID)?.leadScore).toBe(4);
		const result = await run("update_lead_signals", {
			priceWithinReach: true,
			wantsLiveWithin30Days: true,
		});
		expect(result).toMatchObject({ band: "close_now", score: 8 });
		expect(report).toHaveBeenCalledWith({
			customerId: ID,
			eventName: "QualifiedLead",
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
