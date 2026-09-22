import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import {
  generateSiteRequestSchema,
  type GenerateSiteRequest,
  type GenerateSiteResponse,
  type SiteSpecification,
} from "@where-they-are/contracts";

import { readServerConfig, type ServerConfig } from "../config/config.js";
import { generateSiteSpecification, createSiteSpecificationAgent } from "./ai-site-agent.js";
import { buildSiteSpecification } from "./build-specification.js";
import { ReleaseStore } from "./release-store.js";
import { renderSiteHtml } from "./render-site.js";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "business";

@Injectable()
export class GeneratorService {
  private readonly config: ServerConfig;
  private readonly releaseStore: ReleaseStore;

  public constructor() {
    this.config = readServerConfig();
    this.releaseStore = new ReleaseStore();
  }

  public async generate(input: unknown): Promise<GenerateSiteResponse> {
    const request = generateSiteRequestSchema.parse(input);
    const specification = await this.createSpecification(request);
    const releaseId = randomUUID();
    const previewSlug = `${slugify(specification.businessName)}-${releaseId.slice(0, 8)}`;
    const html = renderSiteHtml(specification);

    await this.releaseStore.save({
      releaseId,
      businessId: request.businessId,
      siteId: request.siteId,
      previewSlug,
      specification,
      html,
    });

    return {
      releaseId,
      previewSlug,
      previewUrl: `${this.config.PREVIEW_SITE_ORIGIN}/preview/${previewSlug}`,
      specification,
    };
  }

  private async createSpecification(request: GenerateSiteRequest): Promise<SiteSpecification> {
    if (!this.config.OPENROUTER_API_KEY) {
      return buildSiteSpecification(request);
    }

    const agent = createSiteSpecificationAgent(this.config.OPENROUTER_MODEL);
    return generateSiteSpecification(agent, request);
  }
}
