import { describe, expect, it } from "vitest";

import { buildKnowledge, searchKnowledge } from "./knowledge.js";

const entries = buildKnowledge();
const RETIRED_WEBSITE_OFFER = /\$250|\$125|hosting is|Paynow|deposit/;
const top = (query: string) => searchKnowledge(entries, query)[0]?.id;

describe("searchKnowledge", () => {
	it("finds approved answers for common dealer questions", () => {
		expect(top("we already post ourselves on facebook")).toBe(
			"objection_already_posting"
		);
		expect(top("do you do this for a restaurant")).toBe("other_businesses");
		expect(top("is the prado still available")).toBe("car_buyers");
		expect(top("how do i pay, ecocash or bank?")).toBe("payment_terms");
		expect(top("can you also build us a website")).toBe("other_services");
		expect(top("we don't have good photos")).toBe("photos");
	});

	it("answers the script's objections", () => {
		expect(top("that's too expensive for me")).toBe("objection_price");
		expect(top("let me think about it")).toBe("objection_think");
		expect(top("can you guarantee more sales")).toBe("guarantees");
	});

	it("never sells the retired website offer", () => {
		const all = entries.map((entry) => entry.answer).join(" ");
		expect(all).not.toMatch(RETIRED_WEBSITE_OFFER);
	});

	it("returns nothing for unrelated questions", () => {
		expect(searchKnowledge(entries, "zzz qqq")).toEqual([]);
	});
});
