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
import { BillingService } from "./billing.service.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

const subscriptionSchema = z.object({
	amount: amountSchema,
	currency: z.string().length(3).default("USD"),
	currentPeriodEnd: z.coerce.date(),
	currentPeriodStart: z.coerce.date().optional(),
	externalReference: z.string().min(1).optional(),
	interval: z.string().min(1).default("month"),
	plan: z.enum(["STARTER", "GROWTH", "PREMIUM"]),
	siteId: z.string().min(1).optional(),
});

const subscriptionStatusSchema = z.object({
	cancelledAt: z.coerce.date().nullable().optional(),
	status: z.enum(["ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"]),
});

const invoiceSchema = z.object({
	amount: amountSchema,
	currency: z.string().length(3).default("USD"),
	description: z.string().min(1).optional(),
	dueAt: z.coerce.date().nullable().optional(),
	metadata: z.unknown().optional(),
	status: z
		.enum(["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"])
		.default("OPEN"),
	subscriptionId: z.string().min(1).optional(),
});

const invoiceStatusSchema = z.object({
	paidAt: z.coerce.date().nullable().optional(),
	status: z.enum(["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"]),
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
		@Param("subscriptionId") subscriptionId: string
	) {
		return this.billingService.getSubscription(businessId, subscriptionId);
	}

	@Post("subscriptions")
	public createSubscription(
		@Param("businessId") businessId: string,
		@Headers("x-user-id") actorUserId: string,
		@Body() body: unknown
	) {
		const input = subscriptionSchema.parse(body);
		return this.billingService.createSubscription({
			actorUserId,
			businessId,
			...input,
		});
	}

	@Post("subscriptions/:subscriptionId/status")
	public updateSubscriptionStatus(
		@Param("businessId") businessId: string,
		@Param("subscriptionId") subscriptionId: string,
		@Headers("x-user-id") actorUserId: string,
		@Body() body: unknown
	) {
		const input = subscriptionStatusSchema.parse(body);
		return this.billingService.updateSubscriptionStatus({
			actorUserId,
			businessId,
			subscriptionId,
			...input,
		});
	}

	@Get("invoices")
  public listInvoices(@Param("businessId") businessId: string) {
    return this.billingService.listInvoices(businessId);
  }

	@Get("invoices/:invoiceId")
	public getInvoice(
		@Param("businessId") businessId: string,
		@Param("invoiceId") invoiceId: string
	) {
		return this.billingService.getInvoice(businessId, invoiceId);
	}

	@Post("invoices")
	public createInvoice(
		@Param("businessId") businessId: string,
		@Headers("x-user-id") actorUserId: string,
		@Body() body: unknown
	) {
		const input = invoiceSchema.parse(body);
		return this.billingService.createInvoice({
			actorUserId,
			businessId,
			...input,
		});
	}

	@Post("invoices/:invoiceId/status")
	public updateInvoiceStatus(
		@Param("businessId") businessId: string,
		@Param("invoiceId") invoiceId: string,
		@Headers("x-user-id") actorUserId: string,
		@Body() body: unknown
	) {
		const input = invoiceStatusSchema.parse(body);
		return this.billingService.updateInvoiceStatus({
			actorUserId,
			businessId,
			invoiceId,
			...input,
		});
	}
}
