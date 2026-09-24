import type { GenerateSiteRequest } from "@where-they-are/contracts";

export const smokeGenerateRequest: GenerateSiteRequest = {
	intake: {
		assetNotes: [],
		businessCategory: "barber",
		businessName: "Smoke Test Barber",
		description: "A smoke-test business used to verify the website generator.",
		factualClaims: ["Serving Harare"],
		intent: "new_lead",
		location: "Harare",
		missingFields: [],
		operatingHours: null,
		phone: "+263771234567",
		services: ["Haircuts"],
		suggestedReply:
			"Thanks. We have enough information to prepare your preview.",
		whatsapp: "+263771234567",
	},
	intakeMessageIds: ["smoke-test-message"],
	plan: "starter",
};
