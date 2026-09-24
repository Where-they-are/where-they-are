import { describe, expect, it } from "vitest";

import { isOptIn, isOptOut } from "./intents.js";
import {
	splitIntoBubbles,
	toWhatsAppText,
	typingDelayMs,
} from "./reply-format.js";

describe("toWhatsAppText", () => {
	it("converts markdown to WhatsApp formatting", () => {
		expect(toWhatsAppText("## Price\n**$250** once-off")).toBe(
			"Price\n*$250* once-off"
		);
		expect(toWhatsAppText("See [the demo](https://example.com)")).toBe(
			"See the demo: https://example.com"
		);
	});
});

describe("splitIntoBubbles", () => {
	it("keeps short replies as one bubble", () => {
		expect(
			splitIntoBubbles("Thanks, Tatenda.\n\nWhere is the dealership?")
		).toEqual(["Thanks, Tatenda. Where is the dealership?"]);
	});

	it("keeps a link with the line that introduces it", () => {
		expect(
			splitIntoBubbles(
				"Have a look here:\n\nhttps://dealership-demo.wheretheyare.co.zw"
			)
		).toEqual([
			"Have a look here:\nhttps://dealership-demo.wheretheyare.co.zw",
		]);
	});

	it("never sends more than three bubbles", () => {
		const long = Array.from(
			{ length: 5 },
			(_, index) =>
				`Paragraph ${index} is long enough to stand on its own as a separate WhatsApp message here.`
		).join("\n\n");
		expect(splitIntoBubbles(long)).toHaveLength(3);
	});

	it("paces typing between one and four seconds", () => {
		expect(typingDelayMs("ok")).toBe(900);
		expect(typingDelayMs("x".repeat(1000))).toBe(4000);
	});
});

describe("opt-out intents", () => {
	it("recognises clear stop requests only", () => {
		expect(isOptOut("STOP")).toBe(true);
		expect(isOptOut("please don't message me again")).toBe(false);
		expect(isOptOut("don't message me again")).toBe(true);
		expect(isOptOut("stop by our yard on Saturday")).toBe(false);
		expect(isOptIn("start")).toBe(true);
	});
});
