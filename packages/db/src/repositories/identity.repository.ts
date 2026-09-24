import { db } from "../client.js";
import type { Prisma } from "../generated/prisma/client.js";

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
			create: {
				displayName: input.ownerDisplayName,
				email: input.ownerEmail,
				phone: input.phone,
			},
			update: { displayName: input.ownerDisplayName, phone: input.phone },
			where: { email: input.ownerEmail },
		});

		const business = await transaction.business.create({
			data: {
				category: input.category,
				location: input.location,
				memberships: {
					create: {
						role: "OWNER",
						status: "ACTIVE",
						userId: owner.id,
					},
				},
				name: input.businessName,
				phone: input.phone,
				slug: input.businessSlug,
				whatsapp: input.whatsapp,
			},
			include: { memberships: true },
		});

		return { business, owner };
	});

export const findBusinessForMember = async (
	businessId: string,
	userId: string
) =>
	db.business.findFirst({
		include: {
			memberships: { include: { user: true } },
		},
		where: {
			id: businessId,
			memberships: {
				some: {
					status: "ACTIVE",
					userId,
				},
			},
		},
	});

export const addBusinessMember = async (input: {
	businessId: string;
	userId: string;
	role?: "OWNER" | "STAFF" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN";
}) =>
	db.businessMember.upsert({
		create: {
			businessId: input.businessId,
			role: input.role ?? "STAFF",
			status: "ACTIVE",
			userId: input.userId,
		},
		update: { role: input.role ?? "STAFF", status: "ACTIVE" },
		where: {
			businessId_userId: {
				businessId: input.businessId,
				userId: input.userId,
			},
		},
	});
