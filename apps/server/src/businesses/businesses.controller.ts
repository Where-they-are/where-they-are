import {
	Body,
	Controller,
	Get,
	Headers,
	Inject,
	Param,
	Post,
	UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { BusinessesService } from "./businesses.service.js";

const memberSchema = z.object({
	role: z
		.enum(["OWNER", "STAFF", "SUPPORT", "ADMIN", "SUPER_ADMIN"])
		.default("STAFF"),
	userId: z.string().min(1),
});

const siteSchema = z.object({
	name: z.string().min(1),
	plan: z.enum(["STARTER", "GROWTH", "PREMIUM"]).default("STARTER"),
	slug: z.string().regex(/^[a-z0-9-]+$/),
	template: z
		.enum(["SERVICE_PRO", "HOSPITALITY", "EVENTS_COMMUNITY"])
		.default("SERVICE_PRO"),
});

@Controller("businesses/:businessId")
@UseGuards(TenantAuthGuard)
export class BusinessesController {
	public constructor(@Inject(BusinessesService) private readonly businessesService: BusinessesService) {}

	@Get()
	public getBusiness(
		@Param("businessId") businessId: string,
		@Headers("x-user-id") userId: string
	) {
		return this.businessesService.getBusiness(businessId, userId);
	}

	@Post("members")
	public addMember(
		@Param("businessId") businessId: string,
		@Headers("x-user-id") actorUserId: string,
		@Body() body: unknown
	) {
		const input = memberSchema.parse(body);
		return this.businessesService.addMember({
			actorUserId,
			businessId,
			...input,
		});
	}

	@Post("sites")
	public createSite(
		@Param("businessId") businessId: string,
		@Headers("x-user-id") actorUserId: string,
		@Body() body: unknown
	) {
		const input = siteSchema.parse(body);
		return this.businessesService.createSite({
			actorUserId,
			businessId,
			...input,
		});
	}
}
