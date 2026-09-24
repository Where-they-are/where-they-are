import { Agent } from "@mastra/core/agent";
import {
	type GenerateSiteRequest,
	type SiteSpecification,
	siteSpecificationSchema,
} from "@where-they-are/contracts";

const instructions = [
	"You generate a modern brochure website specification for a Zimbabwean business.",
	"Use only the factual information supplied in the intake object.",
	"Never invent prices, testimonials, credentials, addresses, opening hours, or services.",
	"Use one of the approved templates: service-pro, hospitality, or events-community.",
	"Use concise, professional English. If a field is missing, leave it null or use a neutral call to action.",
	"Return only the requested structured object.",
].join(" ");

export const createSiteSpecificationAgent = (model: string): Agent =>
	new Agent({
		id: "where-they-are-site-specification",
		instructions,
		model: `openrouter/${model}`,
		name: "Where They Are Site Specification Generator",
	});

export const generateSiteSpecification = async (
	agent: Agent,
	request: GenerateSiteRequest
): Promise<SiteSpecification> => {
	const response = await agent.generate(
		`Create a site specification from this validated intake object:\n${JSON.stringify(request)}`,
		{
			maxSteps: 1,
			modelSettings: {
				maxOutputTokens: 2500,
				temperature: 0.25,
			},
			structuredOutput: {
				jsonPromptInjection: "auto",
				schema: siteSpecificationSchema,
			},
		}
	);

	if (!response.object) {
		throw new Error("Mastra returned no site specification");
	}

	return siteSpecificationSchema.parse(response.object);
};
