import { RequestContext } from "@mastra/core/request-context";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { socialMediaOffer } from "../knowledge/offer.js";
import { MetaReporter } from "../meta/meta-reporter.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import { CUSTOMER_ID_KEY, createAngelTools, IGNORED_KEY } from "./tools.js";

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

const setup = (examplesUrl = "") => {
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
	const report = vi.spyOn(meta, "report");
	const tools = createAngelTools({
		crm,
		examplesUrl,
		knowledge: [],
		meta,
		notifier,
		offer,
		takeoverHours: 12,
	});
	const requestContext = new RequestContext();
	requestContext.set(CUSTOMER_ID_KEY, ID);
	const run = (name: keyof typeof tools, input: Record<string, unknown>) =>
		(tools[name] as Executable).execute?.(
			input as never,
			{ requestContext } as never
		) as Promise<Record<string, unknown>>;
	return { crm, notifier, report, requestContext, run };
};

describe("offer and plan tools", () => {
	it("lists the plans and the launch offer", async () => {
		const { run } = setup();
		const offer = await run("get_offer", {});
		expect(offer.plans).toContain("Growth Plan: 12 posts/month");
		expect(offer.plans).toContain("$48 for the first month");
		expect(offer.launchOffer).toContain("5 places left");
		expect(offer.ownerConfirms).toContain("Payment method");
	});

	it("recommends one plan from the frequency they want and records it", async () => {
		const { crm, run } = setup();
		const result = await run("recommend_plan", {
			desiredFrequency: "three_times_a_week",
		});
		expect(result).toMatchObject({
			firstMonthUsd: 48,
			nextQuestion: "Would you like to get started with that plan?",
			plan: "Growth Plan",
		});
		expect(result.pitch).toContain("$96 per month");
		expect(crm.get(ID)).toMatchObject({
			recommendedPlan: "growth",
			stage: "plan_recommended",
		});
	});

	it("honours a plan the lead asked for by name", async () => {
		const { crm, run } = setup();
		const result = await run("recommend_plan", {
			desiredFrequency: "unsure",
			plan: "starter",
		});
		expect(result.pitch).toContain("$32 per month");
		expect(crm.get(ID)?.recommendedPlan).toBe("starter");
	});
});

describe("examples", () => {
	it("hands over when no examples are approved", async () => {
		const { run } = setup();
		expect(await run("share_examples", {})).toMatchObject({ available: false });
	});

	it("shares the approved examples link", async () => {
		const { crm, run } = setup("https://facebook.com/wheretheyare.examples");
		expect(await run("share_examples", {})).toMatchObject({
			available: true,
			url: "https://facebook.com/wheretheyare.examples",
		});
		expect(crm.events(ID).map((event) => event.type)).toContain(
			"examples_shared"
		);
	});
});

describe("lead score", () => {
	it("scores the lead as details arrive and qualifies it once for Meta", async () => {
		const { crm, report, run } = setup();
		await run("save_customer_details", {
			businessName: "Tino Motors",
			businessType: "car_dealership",
			isDecisionMaker: "yes",
			postingHabit: "only when new stock comes in",
		});
		expect(crm.get(ID)).toMatchObject({
			leadScore: 4,
			postingHabit: "only when new stock comes in",
		});
		const result = await run("update_lead_signals", {
			activeFacebookPage: true,
			clearNeed: true,
			priceWithinReach: true,
		});
		expect(result).toMatchObject({ band: "close_now", score: 9 });
		expect(crm.get(ID)?.stage).toBe("qualified");
		expect(report).toHaveBeenCalledWith({
			customerId: ID,
			eventName: "QualifiedLead",
		});
	});
});

describe("hand-offs and silence", () => {
	it("moves a lead to ready_to_start and alerts the owner with its details", async () => {
		const { crm, notifier, run } = setup();
		await run("save_customer_details", {
			businessName: "Tino Motors",
			facebookUrl: "facebook.com/tinomotors",
			location: "Mutare",
		});
		const result = await run("request_human", {
			reason: "ready_to_start",
			summary: "Tino Motors in Mutare wants Growth",
		});
		expect(result.tellCustomer).toContain("confirm their start and how to pay");
		expect(crm.get(ID)?.stage).toBe("ready_to_start");
		const alert = notifier.sent.at(-1) ?? "";
		expect(alert).toContain("Ready to start");
		expect(alert).toContain("facebook.com/tinomotors");
		expect(alert).toContain(`#client ${ID}`);
	});

	it("keeps a lead's funnel stage for other hand-offs", async () => {
		const { crm, run } = setup();
		crm.setStage(ID, "plan_recommended", { by: "agent" });
		await run("request_human", {
			reason: "other_service",
			summary: "Also wants a website",
		});
		expect(crm.get(ID)?.stage).toBe("plan_recommended");
	});

	it("lets Angel stay silent when a lead firmly says no", async () => {
		const { requestContext, run } = setup();
		await run("ignore_message", { category: "not_interested" });
		expect(requestContext.get(IGNORED_KEY)).toBe("not_interested");
	});
});
