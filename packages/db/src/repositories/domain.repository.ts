import { db } from "../client.js";

export type DomainKind = "CO_ZW" | "CUSTOM";
export type DomainStatus =
	| "REQUESTED"
	| "PENDING_REGISTRATION"
	| "ACTIVE"
	| "SUSPENDED"
	| "EXPIRED"
	| "CANCELLED";

export const createDomain = async (input: {
	businessId: string;
	siteId?: string;
	hostname: string;
	kind: DomainKind;
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

	return db.domain.create({
		data: {
			businessId: input.businessId,
			hostname: input.hostname.toLowerCase(),
			kind: input.kind,
			siteId: input.siteId,
		},
	});
};

export const listDomainsForBusiness = async (businessId: string) =>
	db.domain.findMany({
		include: { site: true },
		orderBy: { createdAt: "desc" },
		where: { businessId },
	});

export const findDomainForBusiness = async (
	businessId: string,
	domainId: string
) =>
	db.domain.findFirst({
		include: { site: true },
		where: { businessId, id: domainId },
	});

export const updateDomainStatus = async (input: {
	businessId: string;
	domainId: string;
	status: DomainStatus;
	registrarReference?: string;
	expiresAt?: Date | null;
	verifiedAt?: Date | null;
}) => {
	const domain = await findDomainForBusiness(input.businessId, input.domainId);

	if (!domain) {
		throw new Error("Domain does not belong to business");
	}

	return db.domain.update({
		data: {
			expiresAt: input.expiresAt,
			registrarReference: input.registrarReference,
			status: input.status,
			verifiedAt: input.verifiedAt,
		},
		where: { id: domain.id },
	});
};
