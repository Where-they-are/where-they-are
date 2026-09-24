import { Body, Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import { z } from "zod";

import { ContactService } from "./contact.service.js";

const publicSubmissionSchema = z.object({
	consent: z.literal(true),
	message: z.string().trim().min(1).max(4000),
	senderEmail: z.string().email().optional(),
	senderName: z.string().trim().min(2).max(100),
	senderPhone: z.string().trim().min(7).max(30).optional(),
});

@Controller("public/sites/:siteId/contact-submissions")
export class PublicContactController {
	public constructor(@Inject(ContactService) private readonly contactService: ContactService) {}

	@Post()
	public create(
		@Param("siteId") siteId: string,
		@Headers("x-idempotency-key") dedupeKey: string | undefined,
		@Body() body: unknown
	) {
		const input = publicSubmissionSchema.parse(body);
		const { consent: _consent, ...submission } = input;
		return this.contactService.createPublic({
			dedupeKey,
			siteId,
			...submission,
		});
	}
}
