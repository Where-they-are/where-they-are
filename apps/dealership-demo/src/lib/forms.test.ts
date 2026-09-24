import { describe, expect, it } from "vitest";

import { emptyTradeIn, tradeInSummary, validateTradeIn } from "@/lib/trade-in";
import {
	hasErrors,
	isValidEmail,
	isValidNationalId,
	isValidPhone,
	parseMileage,
} from "@/lib/validation";

describe("validation", () => {
	it("accepts Zimbabwe WhatsApp numbers in common formats", () => {
		expect(isValidPhone("+263 77 214 5503")).toBe(true);
		expect(isValidPhone("0772145503")).toBe(true);
		expect(isValidPhone("0772")).toBe(false);
	});

	it("checks the full national ID format", () => {
		expect(isValidNationalId("63-2214578 F 42")).toBe(true);
		expect(isValidNationalId("63-2214578F42")).toBe(true);
		expect(isValidNationalId("63-2214578")).toBe(false);
	});

	it("checks email addresses", () => {
		expect(isValidEmail("you@example.com")).toBe(true);
		expect(isValidEmail("you@example")).toBe(false);
	});

	it("parses mileage and rejects nonsense", () => {
		expect(parseMileage("96,000 km")).toBe(96_000);
		expect(parseMileage("")).toBeUndefined();
		expect(parseMileage("9999999")).toBeUndefined();
	});
});

describe("trade-in", () => {
	it("flags every missing field on an empty form", () => {
		const errors = validateTradeIn(emptyTradeIn);
		expect(Object.keys(errors).sort()).toEqual([
			"condition",
			"make",
			"mileage",
			"model",
			"whatsapp",
			"year",
		]);
	});

	it("accepts a complete form", () => {
		const details = {
			condition: "Good" as const,
			make: "Toyota",
			mileage: "96,000",
			model: "Fortuner 2.8 GD-6",
			whatsapp: "+263 77 214 5503",
			year: "2018",
		};
		expect(hasErrors(validateTradeIn(details))).toBe(false);
		expect(tradeInSummary(details)).toBe("96,000 km · Good condition");
	});
});
