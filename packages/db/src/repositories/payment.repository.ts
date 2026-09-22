import { db } from "../client.js";

export type PaymentProvider = "PAYNOW" | "MANUAL";
export type PaymentPurpose = "WEBSITE" | "HOSTING" | "DOMAIN" | "EDIT" | "OTHER";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export type CreatePaymentInput = {
  businessId: string;
  provider: PaymentProvider;
  providerReference?: string;
  amount: string;
  currency?: string;
  purpose: PaymentPurpose;
  description?: string;
  metadata?: unknown;
};

export const createPayment = async (input: CreatePaymentInput) =>
  db.payment.create({
    data: {
      businessId: input.businessId,
      provider: input.provider,
      providerReference: input.providerReference,
      amount: input.amount,
      currency: input.currency ?? "USD",
      purpose: input.purpose,
      description: input.description,
      metadata: input.metadata as object | undefined,
    },
  });

export const listPaymentsForBusiness = async (businessId: string) =>
  db.payment.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

export const findPaymentForBusiness = async (businessId: string, paymentId: string) =>
  db.payment.findFirst({
    where: { id: paymentId, businessId },
  });

export const updatePaymentStatus = async (input: {
  businessId: string;
  paymentId: string;
  status: PaymentStatus;
  providerReference?: string;
  paidAt?: Date | null;
  metadata?: unknown;
}) => {
  const payment = await findPaymentForBusiness(input.businessId, input.paymentId);

  if (!payment) {
    throw new Error("Payment does not belong to business");
  }

  return db.payment.update({
    where: { id: payment.id },
    data: {
      status: input.status,
      providerReference: input.providerReference,
      paidAt: input.paidAt,
      metadata: input.metadata as object | undefined,
    },
  });
};
