import { Body, Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import { z } from "zod";

import { ContactService } from "./contact.service.js";

const publicSubmissionSchema = z.object({
  senderName: z.string().trim().min(2).max(100),
  senderEmail: z.string().email().optional(),
  senderPhone: z.string().trim().min(7).max(30).optional(),
  message: z.string().trim().min(1).max(4000),
  consent: z.literal(true),
});

@Controller("public/sites/:siteId/contact-submissions")
export class PublicContactController {
  public constructor(@Inject(ContactService) private readonly contactService: ContactService) {}

  @Post()
  public create(
    @Param("siteId") siteId: string,
    @Headers("x-idempotency-key") dedupeKey: string | undefined,
    @Body() body: unknown,
  ) {
    const input = publicSubmissionSchema.parse(body);
    const { consent: _consent, ...submission } = input;
    return this.contactService.createPublic({ siteId, dedupeKey, ...submission });
  }
}
