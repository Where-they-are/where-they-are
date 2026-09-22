import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller.js";
import { TenantAuthGuard } from "./tenant-auth.guard.js";

@Module({
  controllers: [AuthController],
  providers: [TenantAuthGuard],
  exports: [TenantAuthGuard],
})
export class AuthModule {}
