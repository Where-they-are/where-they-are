import type { IntakeObject, SiteTemplate } from "@where-they-are/contracts";

const templateKeywords: Record<SiteTemplate, string[]> = {
	"events-community": [
		"event",
		"wedding",
		"school",
		"church",
		"ngo",
		"community",
		"conference",
	],
	hospitality: [
		"restaurant",
		"cafe",
		"food",
		"catering",
		"hotel",
		"lodge",
		"bar",
	],
	"service-pro": [
		"salon",
		"barber",
		"lawyer",
		"legal",
		"consultant",
		"agency",
		"plumber",
	],
};

export const selectTemplate = (intake: IntakeObject): SiteTemplate => {
	const source = [
		intake.businessCategory,
		intake.description,
		...intake.services,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	for (const [template, keywords] of Object.entries(templateKeywords) as [
		SiteTemplate,
		string[],
	][]) {
		if (keywords.some((keyword) => source.includes(keyword))) {
			return template;
		}
	}

	return "service-pro";
};

export const getTemplateLabel = (template: SiteTemplate): string => {
	const labels: Record<SiteTemplate, string> = {
		"events-community": "Events & Community",
		hospitality: "Hospitality",
		"service-pro": "Service Pro",
	};

	return labels[template];
};
