import {
	generateSiteRequestSchema,
	siteSpecificationSchema,
} from "@where-they-are/contracts";
import { describe, expect, it } from "vitest";

import { validGenerateRequest } from "../fixtures.js";

describe("shared contracts", () => {
	it("accepts a complete validated intake request", () => {
		expect(generateSiteRequestSchema.parse(validGenerateRequest)).toEqual(
			validGenerateRequest
		);
	});

	it("rejects unsupported template names in generated output", () => {
		const invalidSpecification = {
			accentColor: "#0f766e",
			assets: [],
			businessName: "Example",
			generatedFrom: { generatorVersion: "test", intakeMessageIds: [] },
			location: null,
			pages: [
				{
					description: "Example site",
					sections: [{ body: "", heading: "Example", items: [], type: "hero" }],
					slug: "home",
					title: "Example",
				},
			],
			phone: null,
			plan: "starter",
			primaryColor: "#153243",
			template: "invented-template",
			whatsapp: null,
		};

		expect(() => siteSpecificationSchema.parse(invalidSpecification)).toThrow();
	});

	it("keeps unknown customer facts explicit through nullable fields", () => {
		const parsed = generateSiteRequestSchema.parse({
			...validGenerateRequest,
			intake: { ...validGenerateRequest.intake, location: null, phone: null },
		});

		expect(parsed.intake.location).toBeNull();
		expect(parsed.intake.phone).toBeNull();
	});

	it("accepts explicit business and site ownership references", () => {
		const parsed = generateSiteRequestSchema.parse({
			...validGenerateRequest,
			businessId: "business_demo",
			siteId: "site_demo",
		});

		expect(parsed.businessId).toBe("business_demo");
		expect(parsed.siteId).toBe("site_demo");
	});

	it("rejects empty ownership references", () => {
		expect(() =>
			generateSiteRequestSchema.parse({
				...validGenerateRequest,
				businessId: "",
			})
		).toThrow();
	});
});
