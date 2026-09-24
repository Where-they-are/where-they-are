import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Post,
	UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { ContactService } from "./contact.service.js";

const statusSchema = z.object({
	status: z.enum(["NEW", "READ", "ARCHIVED", "EXPIRED"]),
});

const starredSchema = z.object({
	starred: z.boolean(),
});

@Controller("businesses/:businessId/contact-submissions")
@UseGuards(TenantAuthGuard)
export class ContactController {
	public constructor(@Inject(ContactService) private readonly contactService: ContactService) {}

	@Get()
  public list(@Param("businessId") businessId: string) {
    return this.contactService.list(businessId);
  }

	@Get(":submissionId")
	public get(
		@Param("businessId") businessId: string,
		@Param("submissionId") submissionId: string
	) {
		return this.contactService.get(businessId, submissionId);
	}

	@Post(":submissionId/read")
	public markRead(
		@Param("businessId") businessId: string,
		@Param("submissionId") submissionId: string
	) {
		return this.contactService.markRead(businessId, submissionId);
	}

	@Post(":submissionId/star")
	public setStarred(
		@Param("businessId") businessId: string,
		@Param("submissionId") submissionId: string,
		@Body() body: unknown
	) {
		const { starred } = starredSchema.parse(body);
		return this.contactService.setStarred(businessId, submissionId, starred);
	}

	@Post(":submissionId/status")
	public setStatus(
		@Param("businessId") businessId: string,
		@Param("submissionId") submissionId: string,
		@Body() body: unknown
	) {
		const { status } = statusSchema.parse(body);
		return this.contactService.setStatus(businessId, submissionId, status);
	}
}
