import { z } from "zod";

export const intakeObjectSchema = z.object({
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

export type IntakeObject = z.infer<typeof intakeObjectSchema>;

export const sitePlanSchema = z.enum(["starter", "growth", "premium"]);
export type SitePlan = z.infer<typeof sitePlanSchema>;

export const siteTemplateSchema = z.enum(["service-pro", "hospitality", "events-community"]);
export type SiteTemplate = z.infer<typeof siteTemplateSchema>;

export const siteSectionSchema = z.object({
  type: z.enum(["hero", "about", "services", "gallery", "testimonials", "contact", "map", "cta"]),
  heading: z.string().min(1),
  body: z.string().default(""),
  items: z.array(z.string()).default([]),
});

export type SiteSection = z.infer<typeof siteSectionSchema>;

export const sitePageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  sections: z.array(siteSectionSchema).min(1),
});

export type SitePage = z.infer<typeof sitePageSchema>;

export const siteSpecificationSchema = z.object({
  businessName: z.string().min(1),
  plan: sitePlanSchema,
  template: siteTemplateSchema,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  location: z.string().nullable(),
  pages: z.array(sitePageSchema).min(1),
  assets: z.array(z.object({
    sourceNote: z.string().min(1),
    filename: z.string().optional(),
  })),
  generatedFrom: z.object({
    intakeMessageIds: z.array(z.string().min(1)),
    generatorVersion: z.string().min(1),
  }),
});

export type SiteSpecification = z.infer<typeof siteSpecificationSchema>;
