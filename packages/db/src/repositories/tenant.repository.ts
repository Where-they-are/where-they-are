import { db } from "../client.js";

export type TenantRole =
	| "OWNER"
	| "STAFF"
	| "SUPPORT"
	| "ADMIN"
	| "SUPER_ADMIN";

export class TenantAccessError extends Error {
	public constructor(message = "Business access denied") {
		super(message);
		this.name = "TenantAccessError";
	}
}

export const requireBusinessMember = async (
	businessId: string,
	userId: string
) => {
	const membership = await db.businessMember.findFirst({
		include: { business: true, user: true },
		where: {
			businessId,
			status: "ACTIVE",
			userId,
		},
	});

	if (!membership) {
		throw new TenantAccessError();
	}

	return membership;
};

export const requireBusinessRole = async (
	businessId: string,
	userId: string,
	allowedRoles: TenantRole[]
) => {
	const membership = await requireBusinessMember(businessId, userId);

	if (!allowedRoles.includes(membership.role as TenantRole)) {
		throw new TenantAccessError("Business role does not permit this action");
	}

	return membership;
};

export const businessScope = (businessId: string) => ({ businessId });

export const memberBusinessScope = (businessId: string, userId: string) => ({
	businessId,
	memberships: {
		some: {
			status: "ACTIVE" as const,
			userId,
		},
	},
});
