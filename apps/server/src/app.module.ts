import { Module } from "@nestjs/common";

import { DeploymentModule } from "./deployment/deployment.module.js";
import { GeneratorModule } from "./generator/generator.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  controllers: [HealthController],
  imports: [DeploymentModule, GeneratorModule],
})
export class AppModule {}
