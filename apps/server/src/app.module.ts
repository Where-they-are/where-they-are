import { Module } from "@nestjs/common";

import { GeneratorModule } from "./generator/generator.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  controllers: [HealthController],
  imports: [GeneratorModule],
})
export class AppModule {}
