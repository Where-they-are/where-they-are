import { Module } from "@nestjs/common";

import { GeneratorController } from "./generator.controller.js";
import { GeneratorService } from "./generator.service.js";
import { PreviewController } from "./preview.controller.js";

@Module({
  controllers: [GeneratorController, PreviewController],
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
