import { describe, expect, it } from "vitest";

import { buildKnowledge, searchKnowledge } from "./knowledge.js";

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
