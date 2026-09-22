import { Module } from "@nestjs/common";

import { ReleaseStore } from "../generator/release-store.js";
import { CoolifyClient } from "./coolify.client.js";
import { DeploymentController } from "./deployment.controller.js";
import { DeploymentService } from "./deployment.service.js";

@Module({
  controllers: [DeploymentController],
  providers: [CoolifyClient, DeploymentService, ReleaseStore],
})
export class DeploymentModule {}
