import { Injectable, ServiceUnavailableException } from "@nestjs/common";

import { readServerConfig, type ServerConfig } from "../config/config.js";

type CoolifyDeployment = {
  message: string;
  resource_uuid: string;
  deployment_uuid: string;
};

type CoolifyDeployResponse = {
  deployments?: CoolifyDeployment[];
  message?: string;
};

@Injectable()
export class CoolifyClient {
  private readonly config: ServerConfig;

  public constructor() {
    this.config = readServerConfig();
  }

  public async deploy(resourceUuid: string, force: boolean): Promise<CoolifyDeployment | null> {
    if (!this.config.COOLIFY_API_URL || !this.config.COOLIFY_API_TOKEN) {
      throw new ServiceUnavailableException("Coolify deployment is not configured");
    }

    const endpoint = new URL("/api/v1/deploy", this.config.COOLIFY_API_URL);
    endpoint.searchParams.set("uuid", resourceUuid);
    if (force) {
      endpoint.searchParams.set("force", "true");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.COOLIFY_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    const body = (await response.json()) as CoolifyDeployResponse;
    if (!response.ok) {
      throw new ServiceUnavailableException(body.message ?? "Coolify deployment request failed");
    }

    return body.deployments?.[0] ?? null;
  }
}
