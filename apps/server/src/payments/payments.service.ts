import { Injectable } from "@nestjs/common";
import {
	createPayment,
	findPaymentForBusiness,
	listPaymentsForBusiness,
	requireBusinessRole,
	updatePaymentStatus,
} from "@where-they-are/db";

@Injectable()
export class PaymentsService {
	public list(businessId: string) {
		return listPaymentsForBusiness(businessId);
	}

	public async create(input: {
		businessId: string;
		actorUserId: string;
		siteId?: string;
		provider: "PAYNOW" | "MANUAL";
		providerReference?: string;
		amount: string;
		currency?: string;
		purpose: "WEBSITE" | "HOSTING" | "DOMAIN" | "EDIT" | "OTHER";
		description?: string;
		metadata?: unknown;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return createPayment(input);
	}

	public async get(businessId: string, paymentId: string) {
		return findPaymentForBusiness(businessId, paymentId);
	}

	public async updateStatus(input: {
		businessId: string;
		actorUserId: string;
		paymentId: string;
		status:
			| "PENDING"
			| "AUTHORIZED"
			| "PAID"
			| "FAILED"
			| "REFUNDED"
			| "CANCELLED";
		providerReference?: string;
		paidAt?: Date | null;
		metadata?: unknown;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return updatePaymentStatus(input);
	}
}
