import type {
	GenerateSiteRequest,
	GenerateSiteResponse,
} from "@where-they-are/contracts";
import { ServerClient } from "@where-they-are/server-client";

const serverClient = new ServerClient({
	baseUrl: process.env.SERVER_BASE_URL ?? "http://localhost:3100",
});

export const dispatchSiteGeneration = (
	request: GenerateSiteRequest
): Promise<GenerateSiteResponse> => serverClient.generateSite(request);

export const checkServerHealth = (): Promise<{
	status: string;
	service: string;
	timestamp: string;
}> => serverClient.getHealth();
