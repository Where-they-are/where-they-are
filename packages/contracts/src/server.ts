import { z } from "zod";

import {
	intakeObjectSchema,
	sitePlanSchema,
	siteSpecificationSchema,
} from "./generator.js";

export const generateSiteRequestSchema = z.object({
	businessId: z.string().min(1).optional(),
	intake: intakeObjectSchema,
	intakeMessageIds: z.array(z.string().min(1)).default([]),
	plan: sitePlanSchema.default("starter"),
	siteId: z.string().min(1).optional(),
});

export type GenerateSiteRequest = z.infer<typeof generateSiteRequestSchema>;

export const generateSiteResponseSchema = z.object({
	previewSlug: z.string().min(1),
	previewUrl: z.string().url(),
	releaseId: z.string().min(1),
	specification: siteSpecificationSchema,
});

export type GenerateSiteResponse = z.infer<typeof generateSiteResponseSchema>;

export const deploySiteRequestSchema = z.object({
	businessId: z.string().min(1).optional(),
	coolifyResourceUuid: z.string().min(1),
	force: z.boolean().default(false),
	releaseId: z.string().min(1),
});

export type DeploySiteRequest = z.infer<typeof deploySiteRequestSchema>;

export const deploySiteResponseSchema = z.object({
	deploymentUuid: z.string().nullable(),
	message: z.string(),
	releaseId: z.string().min(1),
	status: z.enum(["queued", "deployed"]),
});

export type DeploySiteResponse = z.infer<typeof deploySiteResponseSchema>;
