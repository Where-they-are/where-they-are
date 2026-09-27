import { describe, expect, it } from "vitest";

import { recommendPlan, socialMediaOffer } from "./offer.js";

const config = { launchPlaces: 5, launchPlacesUsedOffset: 0 };

describe("socialMediaOffer", () => {
	it("prices the three plans with the launch offer on Growth and Pro only", () => {
		const offer = socialMediaOffer(config, 2);
		expect(offer).toMatchObject({ launchOfferOpen: true, launchPlacesLeft: 3 });
		expect(offer.plans.starter).toMatchObject({
			firstMonthUsd: 32,
			onLaunchOffer: false,
			postsPerMonth: 4,
			priceUsd: 32,
		});
		expect(offer.plans.growth).toMatchObject({
			firstMonthUsd: 48,
			onLaunchOffer: true,
			postsPerMonth: 12,
			priceUsd: 96,
		});
		expect(offer.plans.pro).toMatchObject({
			firstMonthUsd: 120,
			onLaunchOffer: true,
			postsPerMonth: 30,
			priceUsd: 240,
		});
	});

	it("uses the sales script's Growth recommendation word for word", () => {
		expect(socialMediaOffer(config, 0).plans.growth.pitch).toBe(
			"Based on that, the Growth Plan would probably suit you best. It includes 12 posts per month across Facebook and Instagram, about three a week. The normal price is $96 per month, but it is currently $48 for the first month for the first five dealerships.\n\nWe create the posts, show your cars in the best way and publish them consistently. The goal is to help more buyers notice your vehicles, remember your dealership and start conversations when they are ready to buy."
		);
	});

	it("drops the launch price once five dealerships have taken it", () => {
		const offer = socialMediaOffer(config, 5);
		expect(offer.launchOfferOpen).toBe(false);
		expect(offer.plans.growth).toMatchObject({
			firstMonthUsd: 96,
			onLaunchOffer: false,
		});
		expect(offer.plans.growth.pitch).not.toContain("$48");
		expect(offer.plans.pro.pitch).toContain("$240 per month");
	});

	it("counts launch places used outside the CRM", () => {
		expect(
			socialMediaOffer({ ...config, launchPlacesUsedOffset: 4 }, 1)
				.launchOfferOpen
		).toBe(false);
	});
});

describe("recommendPlan", () => {
	it("maps the frequency they want to one plan", () => {
		expect(recommendPlan("once_a_week")).toBe("starter");
		expect(recommendPlan("three_times_a_week")).toBe("growth");
		expect(recommendPlan("every_day")).toBe("pro");
		expect(recommendPlan("unsure")).toBe("growth");
	});
});
