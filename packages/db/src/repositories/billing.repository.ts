import { db } from "../client.js";

export type SubscriptionStatus =
	| "ACTIVE"
	| "PAST_DUE"
	| "PAUSED"
	| "CANCELLED"
	| "EXPIRED";
export type InvoiceStatus =
	| "DRAFT"
	| "OPEN"
	| "PAID"
	| "VOID"
	| "UNCOLLECTIBLE";

export const createSubscription = async (input: {
	businessId: string;
	siteId?: string;
	plan: "STARTER" | "GROWTH" | "PREMIUM";
	amount: string;
	currency?: string;
	interval?: string;
	currentPeriodStart?: Date;
	currentPeriodEnd: Date;
	externalReference?: string;
}) => {
	if (input.siteId) {
		const site = await db.site.findFirst({
			select: { id: true },
			where: { businessId: input.businessId, id: input.siteId },
		});

		if (!site) {
			throw new Error("Site does not belong to business");
		}
	}

	return db.subscription.create({
		data: {
			amount: input.amount,
			businessId: input.businessId,
			currency: input.currency ?? "USD",
			currentPeriodEnd: input.currentPeriodEnd,
			currentPeriodStart: input.currentPeriodStart,
			externalReference: input.externalReference,
			interval: input.interval ?? "month",
			plan: input.plan,
			siteId: input.siteId,
		},
	});
};

export const listSubscriptionsForBusiness = async (businessId: string) =>
	db.subscription.findMany({
		include: {
			invoices: { orderBy: { createdAt: "desc" }, take: 5 },
			site: true,
		},
		orderBy: { createdAt: "desc" },
		where: { businessId },
	});

export const findSubscriptionForBusiness = async (
	businessId: string,
	subscriptionId: string
) =>
	db.subscription.findFirst({
		include: { invoices: { orderBy: { createdAt: "desc" } }, site: true },
		where: { businessId, id: subscriptionId },
	});

export const updateSubscriptionStatus = async (input: {
	businessId: string;
	subscriptionId: string;
	status: SubscriptionStatus;
	cancelledAt?: Date | null;
}) => {
	const subscription = await findSubscriptionForBusiness(
		input.businessId,
		input.subscriptionId
	);

	if (!subscription) {
		throw new Error("Subscription does not belong to business");
	}

	return db.subscription.update({
		data: { cancelledAt: input.cancelledAt, status: input.status },
		where: { id: subscription.id },
	});
};

export const createInvoice = async (input: {
	businessId: string;
	subscriptionId?: string;
	number: string;
	amount: string;
	currency?: string;
	status?: InvoiceStatus;
	description?: string;
	metadata?: unknown;
	dueAt?: Date | null;
}) =>
	db.invoice.create({
		data: {
			amount: input.amount,
			businessId: input.businessId,
			currency: input.currency ?? "USD",
			description: input.description,
			dueAt: input.dueAt,
			metadata: input.metadata as object | undefined,
			number: input.number,
			status: input.status ?? "OPEN",
			subscriptionId: input.subscriptionId,
		},
	});

export const listInvoicesForBusiness = async (businessId: string) =>
	db.invoice.findMany({
		include: { subscription: true },
		orderBy: { createdAt: "desc" },
		where: { businessId },
	});

export const findInvoiceForBusiness = async (
	businessId: string,
	invoiceId: string
) =>
	db.invoice.findFirst({
		include: { subscription: true },
		where: { businessId, id: invoiceId },
	});

export const updateInvoiceStatus = async (input: {
	businessId: string;
	invoiceId: string;
	status: InvoiceStatus;
	paidAt?: Date | null;
}) => {
	const invoice = await findInvoiceForBusiness(
		input.businessId,
		input.invoiceId
	);

	if (!invoice) {
		throw new Error("Invoice does not belong to business");
	}

	return db.invoice.update({
		data: { paidAt: input.paidAt, status: input.status },
		where: { id: invoice.id },
	});
};
