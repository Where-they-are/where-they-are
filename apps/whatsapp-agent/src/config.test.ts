import { describe, expect, it } from "vitest";

import { readConfig } from "./config.js";
import { paynowFromConfig } from "./runtime.js";

const base = { OPENROUTER_API_KEY: "test-key" };

describe("Paynow configuration", () => {
	it("turns payments off without an integration ID and key", () => {
		expect(paynowFromConfig(readConfig(base))).toBeNull();
		expect(
			paynowFromConfig(readConfig({ ...base, PAYNOW_INTEGRATION_ID: "1" }))
		).toBeNull();
	});

	it("turns payments on with an integration ID and key", () => {
		const config = readConfig({
			...base,
			PAYNOW_INTEGRATION_ID: "1",
			PAYNOW_INTEGRATION_KEY: "key",
			PUBLIC_BASE_URL: "https://angel.example.com/",
		});
		expect(config.PUBLIC_BASE_URL).toBe("https://angel.example.com");
		expect(paynowFromConfig(config)).not.toBeNull();
	});
});
