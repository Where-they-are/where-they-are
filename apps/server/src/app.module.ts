import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { BusinessesModule } from "./businesses/businesses.module.js";
import { DeploymentModule } from "./deployment/deployment.module.js";
import { GeneratorModule } from "./generator/generator.module.js";
import { HealthController } from "./health/health.controller.js";
import { SitesModule } from "./sites/sites.module.js";

@Module({
  controllers: [HealthController],
  imports: [AuthModule, BusinessesModule, DeploymentModule, GeneratorModule, SitesModule],
})
export class AppModule {}
