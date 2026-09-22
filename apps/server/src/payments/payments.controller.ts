import { Body, Controller, Get, Headers, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { PaymentsService } from "./payments.service.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

const createPaymentSchema = z.object({
  provider: z.enum(["PAYNOW", "MANUAL"]).default("MANUAL"),
  providerReference: z.string().min(1).optional(),
  amount: amountSchema,
  currency: z.string().length(3).default("USD"),
  purpose: z.enum(["WEBSITE", "HOSTING", "DOMAIN", "EDIT", "OTHER"]),
  description: z.string().min(1).optional(),
  metadata: z.unknown().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "CANCELLED"]),
  providerReference: z.string().min(1).optional(),
  paidAt: z.coerce.date().nullable().optional(),
  metadata: z.unknown().optional(),
});

@Controller("businesses/:businessId/payments")
@UseGuards(TenantAuthGuard)
export class PaymentsController {
  public constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Get()
  public list(@Param("businessId") businessId: string) {
    return this.paymentsService.list(businessId);
  }

  @Get(":paymentId")
  public get(
    @Param("businessId") businessId: string,
    @Param("paymentId") paymentId: string,
  ) {
    return this.paymentsService.get(businessId, paymentId);
  }

  @Post()
  public create(
    @Param("businessId") businessId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = createPaymentSchema.parse(body);
    return this.paymentsService.create({ businessId, actorUserId, ...input });
  }

  @Post(":paymentId/status")
  public updateStatus(
    @Param("businessId") businessId: string,
    @Param("paymentId") paymentId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = updateStatusSchema.parse(body);
    return this.paymentsService.updateStatus({ businessId, paymentId, actorUserId, ...input });
  }
}
