import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { createBusinessWithOwner, findBusinessForMember } from "@where-they-are/db";
import { z } from "zod";

import { TenantAuthGuard } from "./tenant-auth.guard.js";

const bootstrapSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).optional(),
  businessName: z.string().min(1),
  businessSlug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  location: z.string().optional(),
});

@Controller("auth")
export class AuthController {
  @Post("bootstrap")
  public async bootstrap(@Body() body: unknown) {
    const input = bootstrapSchema.parse(body);
    return createBusinessWithOwner({
      ownerEmail: input.email,
      ownerDisplayName: input.displayName,
      businessName: input.businessName,
      businessSlug: input.businessSlug,
      category: input.category,
      phone: input.phone,
      whatsapp: input.whatsapp,
      location: input.location,
    });
  }

  @Get("businesses/:businessId/membership")
  @UseGuards(TenantAuthGuard)
  public async getMembership(
    @Param("businessId") businessId: string,
    @Headers("x-user-id") userId: string,
  ) {
    return findBusinessForMember(businessId, userId);
  }
}
