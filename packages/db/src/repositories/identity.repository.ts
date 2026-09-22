import type { Prisma } from "../generated/prisma/client.js";

import { db } from "../client.js";

export type CreateBusinessInput = {
  ownerEmail: string;
  ownerDisplayName?: string;
  businessName: string;
  businessSlug: string;
  category?: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
};

export const createBusinessWithOwner = async (input: CreateBusinessInput) =>
  db.$transaction(async (transaction: Prisma.TransactionClient) => {
    const owner = await transaction.user.upsert({
      where: { email: input.ownerEmail },
      update: { displayName: input.ownerDisplayName, phone: input.phone },
      create: {
        email: input.ownerEmail,
        displayName: input.ownerDisplayName,
        phone: input.phone,
      },
    });

    const business = await transaction.business.create({
      data: {
        name: input.businessName,
        slug: input.businessSlug,
        category: input.category,
        phone: input.phone,
        whatsapp: input.whatsapp,
        location: input.location,
        memberships: {
          create: {
            userId: owner.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
      },
      include: { memberships: true },
    });

    return { business, owner };
  });

export const findBusinessForMember = async (businessId: string, userId: string) =>
  db.business.findFirst({
    where: {
      id: businessId,
      memberships: {
        some: {
          userId,
          status: "ACTIVE",
        },
      },
    },
    include: {
      memberships: { include: { user: true } },
    },
  });

export const addBusinessMember = async (input: {
  businessId: string;
  userId: string;
  role?: "OWNER" | "STAFF" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN";
}) =>
  db.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: input.businessId,
        userId: input.userId,
      },
    },
    update: { role: input.role ?? "STAFF", status: "ACTIVE" },
    create: {
      businessId: input.businessId,
      userId: input.userId,
      role: input.role ?? "STAFF",
      status: "ACTIVE",
    },
  });
