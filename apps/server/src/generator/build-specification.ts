import type { GenerateSiteRequest, SitePage, SiteSpecification } from "@where-they-are/contracts";

import { selectTemplate } from "./templates.js";

const chooseColor = (value: string | null, fallback: string): string => {
  if (!value) {
    return fallback;
  }

  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
  const palette = ["#153243", "#4f46e5", "#0f766e", "#be123c", "#7c3aed"];
  return palette[hash % palette.length] ?? fallback;
};

const buildHomePage = (request: GenerateSiteRequest): SitePage => {
  const { intake } = request;
  const businessName = intake.businessName ?? "Your business";
  const description = intake.description ?? `${businessName} is ready to meet its customers online.`;

  return {
    slug: "home",
    title: businessName,
    description,
    sections: [
      {
        type: "hero",
        heading: businessName,
        body: description,
        items: [],
      },
      {
        type: "services",
        heading: "What we offer",
        body: "",
        items: intake.services,
      },
      {
        type: "about",
        heading: "About us",
        body: description,
        items: [],
      },
      {
        type: "contact",
        heading: "Get in touch",
        body: intake.location ? `Serving ${intake.location}.` : "Contact us to learn more.",
        items: [],
      },
    ],
  };
};

export const buildSiteSpecification = (request: GenerateSiteRequest): SiteSpecification => {
  const businessName = request.intake.businessName ?? "Your business";
  const template = selectTemplate(request.intake);

  return {
    businessName,
    plan: request.plan,
    template,
    primaryColor: chooseColor(request.intake.businessCategory, "#153243"),
    accentColor: chooseColor(request.intake.location, "#0f766e"),
    phone: request.intake.phone,
    whatsapp: request.intake.whatsapp,
    location: request.intake.location,
    pages: [buildHomePage(request)],
    assets: request.intake.assetNotes.map((sourceNote) => ({ sourceNote })),
    generatedFrom: {
      intakeMessageIds: request.intakeMessageIds,
      generatorVersion: "deterministic-template-v1",
    },
  };
};
