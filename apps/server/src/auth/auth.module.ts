import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller.js";
import { TenantAuthGuard } from "./tenant-auth.guard.js";

@Module({
	controllers: [AuthController],
	exports: [TenantAuthGuard],
	providers: [TenantAuthGuard],
})
export class AuthModule {}
