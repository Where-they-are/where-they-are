import { describe, expect, it } from "vitest";

import { generateSiteRequestSchema, siteSpecificationSchema } from "@where-they-are/contracts";

import { validGenerateRequest } from "../fixtures.js";

describe("shared contracts", () => {
  it("accepts a complete validated intake request", () => {
    expect(generateSiteRequestSchema.parse(validGenerateRequest)).toEqual(validGenerateRequest);
  });

  it("rejects unsupported template names in generated output", () => {
    const invalidSpecification = {
      businessName: "Example",
      plan: "starter",
      template: "invented-template",
      primaryColor: "#153243",
      accentColor: "#0f766e",
      phone: null,
      whatsapp: null,
      location: null,
      pages: [
        {
          slug: "home",
          title: "Example",
          description: "Example site",
          sections: [{ type: "hero", heading: "Example", body: "", items: [] }],
        },
      ],
      assets: [],
      generatedFrom: { intakeMessageIds: [], generatorVersion: "test" },
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
});
