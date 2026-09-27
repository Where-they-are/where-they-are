import { describe, expect, it } from "vitest";

import { formAnswersFrom, isAutomatedBusinessMessage } from "./meta-forms.js";

describe("isAutomatedBusinessMessage", () => {
	it("recognises the ad form's welcome and completion messages", () => {
		expect(
			isAutomatedBusinessMessage({
				body: "Welcome! Please fill out the form below to sign up!",
				type: "chat",
			})
		).toBe(true);
		expect(
			isAutomatedBusinessMessage({
				body: "Thanks. We will review your answers and message you on WhatsApp with the next steps.",
				type: "chat",
			})
		).toBe(true);
	});

	it("treats forms, templates and buttons as automated", () => {
		for (const type of [
			"interactive",
			"native_flow",
			"template_button_reply",
			"list",
		]) {
			expect(isAutomatedBusinessMessage({ body: "", type })).toBe(true);
		}
	});

	it("never mistakes the owner typing for automation", () => {
		expect(
			isAutomatedBusinessMessage({
				body: "Hi Tino, it's Kin here, happy to help you start today",
				type: "chat",
			})
		).toBe(false);
		expect(isAutomatedBusinessMessage({ body: "", type: "image" })).toBe(false);
	});

	it("accepts extra automated texts from settings", () => {
		expect(
			isAutomatedBusinessMessage(
				{ body: "Hello! Tap below to see our plans.", type: "chat" },
				["Hello! Tap below to see our plans"]
			)
		).toBe(true);
	});
});

describe("formAnswersFrom", () => {
	it("reads a WhatsApp form response's JSON answers", () => {
		expect(
			formAnswersFrom({
				interactiveResponseMessage: {
					body: { text: "Sent" },
					nativeFlowResponseMessage: {
						paramsJson: JSON.stringify({
							business_name: "Tino Motors",
							can_you_approve_marketing: "Yes",
							flow_token: "abc",
							where_is_your_dealership_based: "Mutare",
						}),
					},
				},
			})
		).toBe(
			"Sent\nbusiness name: Tino Motors\ncan you approve marketing: Yes\nwhere is your dealership based: Mutare"
		);
	});

	it("reads plain text fields and returns null when there is nothing", () => {
		expect(formAnswersFrom({ caption: "Tino Motors, Mutare" })).toBe(
			"Tino Motors, Mutare"
		);
		expect(formAnswersFrom({ id: 5 })).toBeNull();
		expect(formAnswersFrom(undefined)).toBeNull();
	});
});
