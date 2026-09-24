import { z } from "zod";

export const intakeObjectSchema = z.object({
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

export type IntakeObject = z.infer<typeof intakeObjectSchema>;

export const sitePlanSchema = z.enum(["starter", "growth", "premium"]);
export type SitePlan = z.infer<typeof sitePlanSchema>;

export const siteTemplateSchema = z.enum([
	"service-pro",
	"hospitality",
	"events-community",
]);
export type SiteTemplate = z.infer<typeof siteTemplateSchema>;

export const siteSectionSchema = z.object({
	body: z.string().default(""),
	heading: z.string().min(1),
	items: z.array(z.string()).default([]),
	type: z.enum([
		"hero",
		"about",
		"services",
		"gallery",
		"testimonials",
		"contact",
		"map",
		"cta",
	]),
});

export type SiteSection = z.infer<typeof siteSectionSchema>;

export const sitePageSchema = z.object({
	description: z.string().min(1),
	sections: z.array(siteSectionSchema).min(1),
	slug: z.string().regex(/^[a-z0-9-]+$/),
	title: z.string().min(1),
});

export type SitePage = z.infer<typeof sitePageSchema>;

export const siteSpecificationSchema = z.object({
	accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	assets: z.array(
		z.object({
			filename: z.string().optional(),
			sourceNote: z.string().min(1),
		})
	),
	businessName: z.string().min(1),
	generatedFrom: z.object({
		generatorVersion: z.string().min(1),
		intakeMessageIds: z.array(z.string().min(1)),
	}),
	location: z.string().nullable(),
	pages: z.array(sitePageSchema).min(1),
	phone: z.string().nullable(),
	plan: sitePlanSchema,
	primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	template: siteTemplateSchema,
	whatsapp: z.string().nullable(),
});

export type SiteSpecification = z.infer<typeof siteSpecificationSchema>;
