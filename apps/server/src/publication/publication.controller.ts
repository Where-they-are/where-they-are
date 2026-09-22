import { Body, Controller, Get, Headers, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { PublicationService } from "./publication.service.js";

const createDeploymentSchema = z.object({
  releaseId: z.string().min(1),
  resourceUuid: z.string().min(1).optional(),
});

const updateDeploymentSchema = z.object({
  status: z.enum(["NOT_STARTED", "QUEUED", "IN_PROGRESS", "SUCCEEDED", "FAILED", "BLOCKED"]),
  externalDeploymentId: z.string().min(1).optional(),
  message: z.string().max(1000).optional(),
  startedAt: z.coerce.date().nullable().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
});

@Controller("businesses/:businessId/sites/:siteId/publication")
@UseGuards(TenantAuthGuard)
export class PublicationController {
  public constructor(@Inject(PublicationService) private readonly publicationService: PublicationService) {}

  @Get("status")
  public getStatus(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
  ) {
    return this.publicationService.getStatus(businessId, siteId);
  }

  @Post("deployments")
  public createDeployment(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = createDeploymentSchema.parse(body);
    return this.publicationService.createDeployment({ businessId, siteId, actorUserId, ...input });
  }

  @Post("deployments/:deploymentId/status")
  public updateDeployment(
    @Param("businessId") businessId: string,
    @Param("deploymentId") deploymentId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = updateDeploymentSchema.parse(body);
    return this.publicationService.updateDeployment({ businessId, deploymentId, actorUserId, ...input });
  }
}
