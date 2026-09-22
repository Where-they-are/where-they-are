import { Body, Controller, Get, Headers, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { DomainsService } from "./domains.service.js";

const createDomainSchema = z.object({
  siteId: z.string().min(1).optional(),
  hostname: z.string().min(3).max(253).regex(/^[a-z0-9.-]+$/i),
  kind: z.enum(["CO_ZW", "CUSTOM"]),
});

const updateStatusSchema = z.object({
  status: z.enum(["REQUESTED", "PENDING_REGISTRATION", "ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"]),
  registrarReference: z.string().min(1).optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  verifiedAt: z.coerce.date().nullable().optional(),
});

@Controller("businesses/:businessId/domains")
@UseGuards(TenantAuthGuard)
export class DomainsController {
  public constructor(@Inject(DomainsService) private readonly domainsService: DomainsService) {}

  @Get()
  public list(@Param("businessId") businessId: string) {
    return this.domainsService.list(businessId);
  }

  @Get(":domainId")
  public get(
    @Param("businessId") businessId: string,
    @Param("domainId") domainId: string,
  ) {
    return this.domainsService.get(businessId, domainId);
  }

  @Post()
  public create(
    @Param("businessId") businessId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = createDomainSchema.parse(body);
    return this.domainsService.create({ businessId, actorUserId, ...input });
  }

  @Post(":domainId/status")
  public updateStatus(
    @Param("businessId") businessId: string,
    @Param("domainId") domainId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = updateStatusSchema.parse(body);
    return this.domainsService.updateStatus({ businessId, actorUserId, domainId, ...input });
  }
}
