import type { GenerateSiteRequest } from "@where-they-are/contracts";

export const validGenerateRequest: GenerateSiteRequest = {
  intake: {
    intent: "new_lead",
    businessName: "Mbare Barber Studio",
    businessCategory: "barber",
    description: "A barber studio serving clients in Harare.",
    services: ["Haircuts", "Beard grooming"],
    location: "Harare",
    phone: "+263771234567",
    whatsapp: "+263771234567",
    operatingHours: null,
    factualClaims: ["Serving clients in Harare"],
    assetNotes: ["Customer supplied logo"],
    missingFields: [],
    suggestedReply: "Please share your logo and preferred website plan.",
  },
  plan: "starter",
  intakeMessageIds: ["wamid.test-1"],
};
