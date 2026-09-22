import { Module } from "@nestjs/common";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { BusinessesController } from "./businesses.controller.js";
import { BusinessesService } from "./businesses.service.js";

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService, TenantAuthGuard],
})
export class BusinessesModule {}
