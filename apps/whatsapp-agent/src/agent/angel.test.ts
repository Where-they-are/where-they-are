import { describe, expect, it } from "vitest";

import { angelModels, FALLBACK_MODEL } from "./angel.js";

describe("angelModels", () => {
	it("tries the primary model first, then the fixed fallback", () => {
		const models = angelModels({
			model: "google/gemini-3.8-flash",
			reasoningEffort: "low",
		});
		expect(models.map((entry) => entry.model)).toEqual([
			"openrouter/google/gemini-3.8-flash",
			`openrouter/${FALLBACK_MODEL}`,
		]);
		expect(FALLBACK_MODEL).toBe("google/gemini-3.5-flash");
		for (const entry of models) {
			expect(entry.maxRetries).toBe(1);
			expect(entry.providerOptions.openrouter.reasoning.effort).toBe("low");
		}
	});

	it("does not list the same model twice", () => {
		expect(
			angelModels({ model: FALLBACK_MODEL, reasoningEffort: "minimal" })
		).toHaveLength(1);
	});
});
