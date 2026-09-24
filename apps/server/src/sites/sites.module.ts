import { Module } from "@nestjs/common";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { GeneratorModule } from "../generator/generator.module.js";
import { SitesController } from "./sites.controller.js";
import { SitesService } from "./sites.service.js";

@Module({
	controllers: [SitesController],
	imports: [GeneratorModule],
	providers: [SitesService, TenantAuthGuard],
})
export class SitesModule {}
