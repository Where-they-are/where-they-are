import { db } from "../client.js";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
export type InvoiceStatus = "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE";

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
}) =>
  db.subscription.create({
    data: {
      businessId: input.businessId,
      siteId: input.siteId,
      plan: input.plan,
      amount: input.amount,
      currency: input.currency ?? "USD",
      interval: input.interval ?? "month",
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      externalReference: input.externalReference,
    },
  });

export const listSubscriptionsForBusiness = async (businessId: string) =>
  db.subscription.findMany({
    where: { businessId },
    include: { site: true, invoices: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });

export const findSubscriptionForBusiness = async (businessId: string, subscriptionId: string) =>
  db.subscription.findFirst({
    where: { id: subscriptionId, businessId },
    include: { site: true, invoices: { orderBy: { createdAt: "desc" } } },
  });

export const updateSubscriptionStatus = async (input: {
  businessId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  cancelledAt?: Date | null;
}) => {
  const subscription = await findSubscriptionForBusiness(input.businessId, input.subscriptionId);

  if (!subscription) {
    throw new Error("Subscription does not belong to business");
  }

  return db.subscription.update({
    where: { id: subscription.id },
    data: { status: input.status, cancelledAt: input.cancelledAt },
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
      businessId: input.businessId,
      subscriptionId: input.subscriptionId,
      number: input.number,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: input.status ?? "OPEN",
      description: input.description,
      metadata: input.metadata as object | undefined,
      dueAt: input.dueAt,
    },
  });

export const listInvoicesForBusiness = async (businessId: string) =>
  db.invoice.findMany({
    where: { businessId },
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
  });

export const findInvoiceForBusiness = async (businessId: string, invoiceId: string) =>
  db.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: { subscription: true },
  });

export const updateInvoiceStatus = async (input: {
  businessId: string;
  invoiceId: string;
  status: InvoiceStatus;
  paidAt?: Date | null;
}) => {
  const invoice = await findInvoiceForBusiness(input.businessId, input.invoiceId);

  if (!invoice) {
    throw new Error("Invoice does not belong to business");
  }

  return db.invoice.update({
    where: { id: invoice.id },
    data: { status: input.status, paidAt: input.paidAt },
  });
};
