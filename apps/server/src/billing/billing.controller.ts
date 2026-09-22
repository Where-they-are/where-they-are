import { Body, Controller, Get, Headers, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { BillingService } from "./billing.service.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

const subscriptionSchema = z.object({
  siteId: z.string().min(1).optional(),
  plan: z.enum(["STARTER", "GROWTH", "PREMIUM"]),
  amount: amountSchema,
  currency: z.string().length(3).default("USD"),
  interval: z.string().min(1).default("month"),
  currentPeriodStart: z.coerce.date().optional(),
  currentPeriodEnd: z.coerce.date(),
  externalReference: z.string().min(1).optional(),
});

const subscriptionStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"]),
  cancelledAt: z.coerce.date().nullable().optional(),
});

const invoiceSchema = z.object({
  subscriptionId: z.string().min(1).optional(),
  amount: amountSchema,
  currency: z.string().length(3).default("USD"),
  status: z.enum(["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"]).default("OPEN"),
  description: z.string().min(1).optional(),
  metadata: z.unknown().optional(),
  dueAt: z.coerce.date().nullable().optional(),
});

const invoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"]),
  paidAt: z.coerce.date().nullable().optional(),
});

@Controller("businesses/:businessId/billing")
@UseGuards(TenantAuthGuard)
export class BillingController {
  public constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get("subscriptions")
  public listSubscriptions(@Param("businessId") businessId: string) {
    return this.billingService.listSubscriptions(businessId);
  }

  @Get("subscriptions/:subscriptionId")
  public getSubscription(
    @Param("businessId") businessId: string,
    @Param("subscriptionId") subscriptionId: string,
  ) {
    return this.billingService.getSubscription(businessId, subscriptionId);
  }

  @Post("subscriptions")
  public createSubscription(
    @Param("businessId") businessId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = subscriptionSchema.parse(body);
    return this.billingService.createSubscription({ businessId, actorUserId, ...input });
  }

  @Post("subscriptions/:subscriptionId/status")
  public updateSubscriptionStatus(
    @Param("businessId") businessId: string,
    @Param("subscriptionId") subscriptionId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = subscriptionStatusSchema.parse(body);
    return this.billingService.updateSubscriptionStatus({ businessId, actorUserId, subscriptionId, ...input });
  }

  @Get("invoices")
  public listInvoices(@Param("businessId") businessId: string) {
    return this.billingService.listInvoices(businessId);
  }

  @Get("invoices/:invoiceId")
  public getInvoice(
    @Param("businessId") businessId: string,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.billingService.getInvoice(businessId, invoiceId);
  }

  @Post("invoices")
  public createInvoice(
    @Param("businessId") businessId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = invoiceSchema.parse(body);
    return this.billingService.createInvoice({ businessId, actorUserId, ...input });
  }

  @Post("invoices/:invoiceId/status")
  public updateInvoiceStatus(
    @Param("businessId") businessId: string,
    @Param("invoiceId") invoiceId: string,
    @Headers("x-user-id") actorUserId: string,
    @Body() body: unknown,
  ) {
    const input = invoiceStatusSchema.parse(body);
    return this.billingService.updateInvoiceStatus({ businessId, actorUserId, invoiceId, ...input });
  }
}
