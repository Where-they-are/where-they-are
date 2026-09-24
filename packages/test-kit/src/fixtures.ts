import type { GenerateSiteRequest } from "@where-they-are/contracts";

export const validGenerateRequest: GenerateSiteRequest = {
	intake: {
		assetNotes: ["Customer supplied logo"],
		businessCategory: "barber",
		businessName: "Mbare Barber Studio",
		description: "A barber studio serving clients in Harare.",
		factualClaims: ["Serving clients in Harare"],
		intent: "new_lead",
		location: "Harare",
		missingFields: [],
		operatingHours: null,
		phone: "+263771234567",
		services: ["Haircuts", "Beard grooming"],
		suggestedReply: "Please share your logo and preferred website plan.",
		whatsapp: "+263771234567",
	},
	intakeMessageIds: ["wamid.test-1"],
	plan: "starter",
};
