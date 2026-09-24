import { db } from "../client.js";

export type PaymentProvider = "PAYNOW" | "MANUAL";
export type PaymentPurpose =
	| "WEBSITE"
	| "HOSTING"
	| "DOMAIN"
	| "EDIT"
	| "OTHER";
export type PaymentStatus =
	| "PENDING"
	| "AUTHORIZED"
	| "PAID"
	| "FAILED"
	| "REFUNDED"
	| "CANCELLED";

export type CreatePaymentInput = {
	businessId: string;
	siteId?: string;
	provider: PaymentProvider;
	providerReference?: string;
	amount: string;
	currency?: string;
	purpose: PaymentPurpose;
	description?: string;
	metadata?: unknown;
};

export const createPayment = async (input: CreatePaymentInput) => {
	if (input.siteId) {
		const site = await db.site.findFirst({
			select: { id: true },
			where: { businessId: input.businessId, id: input.siteId },
		});

		if (!site) {
			throw new Error("Site does not belong to business");
		}
	}

	return db.payment.create({
		data: {
			amount: input.amount,
			businessId: input.businessId,
			currency: input.currency ?? "USD",
			description: input.description,
			metadata: input.metadata as object | undefined,
			provider: input.provider,
			providerReference: input.providerReference,
			purpose: input.purpose,
			siteId: input.siteId,
		},
	});
};

export const listPaymentsForBusiness = async (businessId: string) =>
	db.payment.findMany({
		orderBy: { createdAt: "desc" },
		where: { businessId },
	});

export const findPaymentForBusiness = async (
	businessId: string,
	paymentId: string
) =>
	db.payment.findFirst({
		where: { businessId, id: paymentId },
	});

export const updatePaymentStatus = async (input: {
	businessId: string;
	paymentId: string;
	status: PaymentStatus;
	providerReference?: string;
	paidAt?: Date | null;
	metadata?: unknown;
}) => {
	const payment = await findPaymentForBusiness(
		input.businessId,
		input.paymentId
	);

	if (!payment) {
		throw new Error("Payment does not belong to business");
	}

	return db.payment.update({
		data: {
			metadata: input.metadata as object | undefined,
			paidAt: input.paidAt,
			providerReference: input.providerReference,
			status: input.status,
		},
		where: { id: payment.id },
	});
};
