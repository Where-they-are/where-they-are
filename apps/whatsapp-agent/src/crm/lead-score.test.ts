import { describe, expect, it } from "vitest";

import { scoreLead } from "./lead-score.js";

describe("scoreLead", () => {
	it("scores a hot dealership as close now", () => {
		expect(
			scoreLead({
				businessType: "car_dealership",
				isDecisionMaker: "yes",
				leadSignals: {
					engagedWithDemo: true,
					priceWithinReach: true,
					stockReady: true,
					wantsLiveWithin30Days: true,
				},
			})
		).toEqual({
			band: "close_now",
			reasons: [
				"real dealership",
				"price within reach",
				"wants it live within 30 days",
				"decision-maker",
				"stock photos and details ready",
				"engaged with the demo",
			],
			score: 10,
		});
	});

	it("nurtures a dealership that is not ready yet", () => {
		const lead = scoreLead({
			businessType: "car_dealership",
			isDecisionMaker: "yes",
			leadSignals: { engagedWithDemo: true },
		});
		expect(lead).toMatchObject({ band: "nurture", score: 5 });
	});

	it("scores an unknown contact low", () => {
		expect(
			scoreLead({
				businessType: "unknown",
				isDecisionMaker: "unknown",
				leadSignals: {},
			})
		).toEqual({ band: "low", reasons: [], score: 0 });
	});
});
