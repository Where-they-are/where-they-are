import { Body, Controller, Get, Headers, Param, Post, UseGuards } from "@nestjs/common";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { SitesService } from "./sites.service.js";

@Controller("businesses/:businessId/sites")
@UseGuards(TenantAuthGuard)
export class SitesController {
  public constructor(private readonly sitesService: SitesService) {}

  @Get()
  public list(
    @Param("businessId") businessId: string,
    @Headers("x-user-id") userId: string,
  ) {
    return this.sitesService.list(businessId, userId);
  }

  @Get(":siteId")
  public get(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
    @Headers("x-user-id") userId: string,
  ) {
    return this.sitesService.get(businessId, siteId, userId);
  }

  @Post(":siteId/generate")
  public generate(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
    @Headers("x-user-id") userId: string,
    @Body() body: unknown,
  ) {
    return this.sitesService.generate(businessId, siteId, userId, body);
  }
}
