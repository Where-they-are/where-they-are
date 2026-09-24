import type {
	GenerateSiteRequest,
	SitePage,
	SiteSpecification,
} from "@where-they-are/contracts";

import { selectTemplate } from "./templates.js";

const chooseColor = (value: string | null, fallback: string): string => {
	if (!value) {
		return fallback;
	}

	const hash = [...value].reduce(
		(total, character) => total + character.charCodeAt(0),
		0
	);
	const palette = ["#153243", "#4f46e5", "#0f766e", "#be123c", "#7c3aed"];
	return palette[hash % palette.length] ?? fallback;
};

const buildHomePage = (request: GenerateSiteRequest): SitePage => {
	const { intake } = request;
	const businessName = intake.businessName ?? "Your business";
	const description =
		intake.description ??
		`${businessName} is ready to meet its customers online.`;

	return {
		description,
		sections: [
			{
				body: description,
				heading: businessName,
				items: [],
				type: "hero",
			},
			{
				body: "",
				heading: "What we offer",
				items: intake.services,
				type: "services",
			},
			{
				body: description,
				heading: "About us",
				items: [],
				type: "about",
			},
			{
				body: intake.location
					? `Serving ${intake.location}.`
					: "Contact us to learn more.",
				heading: "Get in touch",
				items: [],
				type: "contact",
			},
		],
		slug: "home",
		title: businessName,
	};
};

export const buildSiteSpecification = (
	request: GenerateSiteRequest
): SiteSpecification => {
	const businessName = request.intake.businessName ?? "Your business";
	const template = selectTemplate(request.intake);

	return {
		accentColor: chooseColor(request.intake.location, "#0f766e"),
		assets: request.intake.assetNotes.map((sourceNote) => ({ sourceNote })),
		businessName,
		generatedFrom: {
			generatorVersion: "deterministic-template-v1",
			intakeMessageIds: request.intakeMessageIds,
		},
		location: request.intake.location,
		pages: [buildHomePage(request)],
		phone: request.intake.phone,
		plan: request.plan,
		primaryColor: chooseColor(request.intake.businessCategory, "#153243"),
		template,
		whatsapp: request.intake.whatsapp,
	};
};
