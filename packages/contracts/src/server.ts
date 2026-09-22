import { z } from "zod";

import { intakeObjectSchema, sitePlanSchema, siteSpecificationSchema } from "./generator.js";

export const generateSiteRequestSchema = z.object({
  businessId: z.string().min(1).optional(),
  siteId: z.string().min(1).optional(),
  intake: intakeObjectSchema,
  plan: sitePlanSchema.default("starter"),
  intakeMessageIds: z.array(z.string().min(1)).default([]),
});

export type GenerateSiteRequest = z.infer<typeof generateSiteRequestSchema>;

export const generateSiteResponseSchema = z.object({
  releaseId: z.string().min(1),
  previewSlug: z.string().min(1),
  previewUrl: z.string().url(),
  specification: siteSpecificationSchema,
});

export type GenerateSiteResponse = z.infer<typeof generateSiteResponseSchema>;

export const deploySiteRequestSchema = z.object({
  businessId: z.string().min(1).optional(),
  releaseId: z.string().min(1),
  coolifyResourceUuid: z.string().min(1),
  force: z.boolean().default(false),
});

export type DeploySiteRequest = z.infer<typeof deploySiteRequestSchema>;

export const deploySiteResponseSchema = z.object({
  releaseId: z.string().min(1),
  status: z.enum(["queued", "deployed"]),
  deploymentUuid: z.string().nullable(),
  message: z.string(),
});

export type DeploySiteResponse = z.infer<typeof deploySiteResponseSchema>;
