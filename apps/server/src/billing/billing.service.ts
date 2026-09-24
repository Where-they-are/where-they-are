import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import {
	createInvoice,
	createSubscription,
	findInvoiceForBusiness,
	findSubscriptionForBusiness,
	listInvoicesForBusiness,
	listSubscriptionsForBusiness,
	requireBusinessRole,
	updateInvoiceStatus,
	updateSubscriptionStatus,
} from "@where-they-are/db";

@Injectable()
export class BillingService {
	public listSubscriptions(businessId: string) {
		return listSubscriptionsForBusiness(businessId);
	}

	public getSubscription(businessId: string, subscriptionId: string) {
		return findSubscriptionForBusiness(businessId, subscriptionId);
	}

	public async createSubscription(input: {
		businessId: string;
		actorUserId: string;
		siteId?: string;
		plan: "STARTER" | "GROWTH" | "PREMIUM";
		amount: string;
		currency?: string;
		interval?: string;
		currentPeriodStart?: Date;
		currentPeriodEnd: Date;
		externalReference?: string;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return createSubscription(input);
	}

	public async updateSubscriptionStatus(input: {
		businessId: string;
		actorUserId: string;
		subscriptionId: string;
		status: "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
		cancelledAt?: Date | null;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return updateSubscriptionStatus(input);
	}

	public listInvoices(businessId: string) {
		return listInvoicesForBusiness(businessId);
	}

	public getInvoice(businessId: string, invoiceId: string) {
		return findInvoiceForBusiness(businessId, invoiceId);
	}

	public async createInvoice(input: {
		businessId: string;
		actorUserId: string;
		subscriptionId?: string;
		amount: string;
		currency?: string;
		status?: "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE";
		description?: string;
		metadata?: unknown;
		dueAt?: Date | null;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return createInvoice({ ...input, number: `INV-${randomUUID()}` });
	}

	public async updateInvoiceStatus(input: {
		businessId: string;
		actorUserId: string;
		invoiceId: string;
		status: "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE";
		paidAt?: Date | null;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return updateInvoiceStatus(input);
	}
}
