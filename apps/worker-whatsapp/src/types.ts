import { z } from "zod";

export const mediaSchema = z.object({
  mimeType: z.string().min(1),
  base64: z.string().min(1),
  filename: z.string().optional(),
});

export type IncomingMedia = z.infer<typeof mediaSchema>;

export const normalizedMessageSchema = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  senderId: z.string().min(1),
  receivedAt: z.coerce.date(),
  text: z.string(),
  media: mediaSchema.optional(),
  mediaKind: z.enum(["image", "audio", "other"]).optional(),
});

export type NormalizedMessage = z.infer<typeof normalizedMessageSchema>;

export const siteIntakeSchema = z.object({
  intent: z.enum(["new_lead", "provide_details", "ask_question", "revision", "support", "unknown"]),
  businessName: z.string().nullable(),
  businessCategory: z.string().nullable(),
  description: z.string().nullable(),
  services: z.array(z.string()),
  location: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  operatingHours: z.string().nullable(),
  factualClaims: z.array(z.string()),
  assetNotes: z.array(z.string()),
  missingFields: z.array(z.string()),
  suggestedReply: z.string().min(1),
});

export type SiteIntake = z.infer<typeof siteIntakeSchema>;
