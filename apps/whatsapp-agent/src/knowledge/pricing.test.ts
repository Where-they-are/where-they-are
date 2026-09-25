import { describe, expect, it } from "vitest";

import { dealershipPricing } from "./pricing.js";

const pricingConfig = {
	earlyPriceUsd: 250,
	earlySlots: 5,
	earlySlotsUsedOffset: 0,
	standardPriceUsd: 400,
};

describe("dealershipPricing", () => {
	it("leads with the founding price and the three free extras", () => {
		const pricing = dealershipPricing(pricingConfig, 2);
		expect(pricing).toMatchObject({
			balanceUsd: 125,
			currentPriceUsd: 250,
			depositUsd: 125,
			earlySlotsLeft: 3,
			isEarlyPrice: true,
		});
		expect(pricing.headline).toBe(
			"For our first 5 dealerships, a dealership website is $250 instead of $400, with a free domain, free import of your current stock and free fixes within 48 hours."
		);
	});

	it("keeps the other terms apart for when they become relevant", () => {
		const { headline, terms } = dealershipPricing(pricingConfig, 0);
		expect(headline).not.toContain("hosting");
		expect(headline).not.toContain("deposit");
		expect(terms.payment).toBe(
			"$125 deposit to start, and the remaining $125 only after the site is delivered."
		);
		expect(terms.hosting).toContain("free for the first month, then $15/month");
		expect(terms.missedDeadline).toContain("does not pay the $125 balance");
		expect(terms.delivery).toContain("within 3 days");
	});

	it("switches to the standard price once five dealerships have paid", () => {
		const pricing = dealershipPricing(pricingConfig, 5);
		expect(pricing).toMatchObject({
			balanceUsd: 200,
			currentPriceUsd: 400,
			depositUsd: 200,
			isEarlyPrice: false,
		});
		expect(pricing.headline).not.toContain("$250");
	});

	it("counts dealerships signed outside the CRM", () => {
		const pricing = dealershipPricing(
			{ ...pricingConfig, earlySlotsUsedOffset: 4 },
			1
		);
		expect(pricing.isEarlyPrice).toBe(false);
	});
});
