import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { generateSiteRequestSchema } from "@where-they-are/contracts";
import {
	findSiteForBusiness,
	listSitesForBusiness,
	requireBusinessMember,
} from "@where-they-are/db";

import { GeneratorService } from "../generator/generator.service.js";

@Injectable()
export class SitesService {
	public constructor(@Inject(GeneratorService) private readonly generatorService: GeneratorService) {}

	public async list(businessId: string, userId: string) {
		await requireBusinessMember(businessId, userId);
		return listSitesForBusiness(businessId);
	}

	public async get(businessId: string, siteId: string, userId: string) {
		await requireBusinessMember(businessId, userId);
		const site = await findSiteForBusiness(businessId, siteId);

		if (!site) {
			throw new NotFoundException("Site was not found for this business");
		}

		return site;
	}

	public async generate(
		businessId: string,
		siteId: string,
		userId: string,
		body: unknown
	) {
		await requireBusinessMember(businessId, userId);
		const site = await findSiteForBusiness(businessId, siteId);

		if (!site) {
			throw new NotFoundException("Site was not found for this business");
		}

		const request = generateSiteRequestSchema.parse({
			...(body as Record<string, unknown>),
			businessId,
			siteId,
		});

		return this.generatorService.generate(request);
	}
}
