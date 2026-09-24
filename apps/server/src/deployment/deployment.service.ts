import { Injectable, NotFoundException } from "@nestjs/common";
import {
	type DeploySiteResponse,
	deploySiteRequestSchema,
} from "@where-they-are/contracts";
import type { ReleaseStore } from "../generator/release-store.js";
import type { CoolifyClient } from "./coolify.client.js";

@Injectable()
export class DeploymentService {
	public constructor(
		private readonly coolifyClient: CoolifyClient,
		private readonly releaseStore: ReleaseStore
	) {}

	public async deploy(input: unknown): Promise<DeploySiteResponse> {
		const request = deploySiteRequestSchema.parse(input);
		if (
			!(await this.releaseStore.exists(request.releaseId, request.businessId))
		) {
			throw new NotFoundException(`Release ${request.releaseId} was not found`);
		}

		const deployment = await this.coolifyClient.deploy(
			request.coolifyResourceUuid,
			request.force
		);

		return {
			deploymentUuid: deployment?.deployment_uuid ?? null,
			message: deployment?.message ?? "Coolify accepted the deployment request",
			releaseId: request.releaseId,
			status: deployment ? "queued" : "deployed",
		};
	}
}
