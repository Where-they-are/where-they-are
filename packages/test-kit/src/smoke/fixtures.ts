import type { GenerateSiteRequest } from "@where-they-are/contracts";

export const smokeGenerateRequest: GenerateSiteRequest = {
  intake: {
    intent: "new_lead",
    businessName: "Smoke Test Barber",
    businessCategory: "barber",
    description: "A smoke-test business used to verify the website generator.",
    services: ["Haircuts"],
    location: "Harare",
    phone: "+263771234567",
    whatsapp: "+263771234567",
    operatingHours: null,
    factualClaims: ["Serving Harare"],
    assetNotes: [],
    missingFields: [],
    suggestedReply: "Thanks. We have enough information to prepare your preview.",
  },
  plan: "starter",
  intakeMessageIds: ["smoke-test-message"],
};
