import { describe, expect, it } from "vitest";

import { buildKnowledge, searchKnowledge } from "./knowledge.js";
import { dealershipPricing } from "./pricing.js";

const pricingConfig = {
	earlyPriceUsd: 250,
	earlySlots: 5,
	earlySlotsUsedOffset: 0,
	standardPriceUsd: 400,
};

describe("dealershipPricing", () => {
	it("offers the early price while slots remain", () => {
		const pricing = dealershipPricing(pricingConfig, 2);
		expect(pricing).toMatchObject({
			currentPriceUsd: 250,
			earlySlotsLeft: 3,
			isEarlyPrice: true,
		});
		expect(pricing.statement).toContain("$250");
		expect(pricing.statement).toContain("$400");
		expect(pricing.statement).toContain("3 of those spots");
	});

	it("switches to the standard price once the first five have signed", () => {
		const pricing = dealershipPricing(pricingConfig, 5);
		expect(pricing).toMatchObject({
			currentPriceUsd: 400,
			isEarlyPrice: false,
		});
		expect(pricing.statement).not.toContain("$250");
	});

	it("counts dealerships signed outside the CRM", () => {
		const pricing = dealershipPricing(
			{ ...pricingConfig, earlySlotsUsedOffset: 4 },
			1
		);
		expect(pricing.isEarlyPrice).toBe(false);
	});
});

describe("searchKnowledge", () => {
	const entries = buildKnowledge("https://dealership-demo.wheretheyare.co.zw");

	it("finds approved answers for common questions", () => {
		const top = (query: string) => searchKnowledge(entries, query)[0]?.id;
		expect(top("how much does hosting cost per month")).toBe("hosting_domain");
		expect(top("we already have a facebook page")).toBe("objection_facebook");
		expect(top("do you do websites for a salon")).toBe("other_businesses");
		expect(top("is the prado still available")).toBe("car_buyers");
		expect(top("send me your ecocash number to pay")).toBe("payment");
	});

	it("puts the demo link into the demo entry", () => {
		const demo = entries.find((entry) => entry.id === "demo");
		expect(demo?.answer).toContain(
			"https://dealership-demo.wheretheyare.co.zw"
		);
	});

	it("returns nothing for unrelated questions", () => {
		expect(searchKnowledge(entries, "zzz qqq")).toEqual([]);
	});
});
