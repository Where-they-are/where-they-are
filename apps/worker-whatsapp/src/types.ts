import { z } from "zod";

export const mediaSchema = z.object({
	base64: z.string().min(1),
	filename: z.string().optional(),
	mimeType: z.string().min(1),
});

export type IncomingMedia = z.infer<typeof mediaSchema>;

export const normalizedMessageSchema = z.object({
	chatId: z.string().min(1),
	id: z.string().min(1),
	media: mediaSchema.optional(),
	mediaKind: z.enum(["image", "audio", "other"]).optional(),
	receivedAt: z.coerce.date(),
	senderId: z.string().min(1),
	text: z.string(),
});

export type NormalizedMessage = z.infer<typeof normalizedMessageSchema>;

export const siteIntakeSchema = z.object({
	assetNotes: z.array(z.string()),
	businessCategory: z.string().nullable(),
	businessName: z.string().nullable(),
	description: z.string().nullable(),
	factualClaims: z.array(z.string()),
	intent: z.enum([
		"new_lead",
		"provide_details",
		"ask_question",
		"revision",
		"support",
		"unknown",
	]),
	location: z.string().nullable(),
	missingFields: z.array(z.string()),
	operatingHours: z.string().nullable(),
	phone: z.string().nullable(),
	services: z.array(z.string()),
	suggestedReply: z.string().min(1),
	whatsapp: z.string().nullable(),
});

export type SiteIntake = z.infer<typeof siteIntakeSchema>;
