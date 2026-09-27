import { describe, expect, it } from "vitest";

import { scoreLead } from "./lead-score.js";

describe("scoreLead", () => {
	it("scores a ready dealership as close now", () => {
		expect(
			scoreLead({
				businessType: "car_dealership",
				isDecisionMaker: "yes",
				leadSignals: {
					activeFacebookPage: true,
					clearNeed: true,
					photosReady: true,
					priceWithinReach: true,
				},
			})
		).toEqual({
			band: "close_now",
			reasons: [
				"real dealership",
				"posts irregularly or wants to appear more often",
				"price within reach",
				"decision-maker",
				"active Facebook page",
				"vehicle photos and details ready",
			],
			score: 10,
		});
	});

	it("keeps talking to a dealership with a need but no decision yet", () => {
		const lead = scoreLead({
			businessType: "car_dealership",
			isDecisionMaker: "unknown",
			leadSignals: { activeFacebookPage: true, clearNeed: true },
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
