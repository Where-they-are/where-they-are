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
      where: { id: input.siteId, businessId: input.businessId },
      select: { id: true },
    });

    if (!site) {
      throw new Error("Site does not belong to business");
    }
  }

  return db.domain.create({
    data: {
      businessId: input.businessId,
      siteId: input.siteId,
      hostname: input.hostname.toLowerCase(),
      kind: input.kind,
    },
  });
};

export const listDomainsForBusiness = async (businessId: string) =>
  db.domain.findMany({
    where: { businessId },
    include: { site: true },
    orderBy: { createdAt: "desc" },
  });

export const findDomainForBusiness = async (businessId: string, domainId: string) =>
  db.domain.findFirst({
    where: { id: domainId, businessId },
    include: { site: true },
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
    where: { id: domain.id },
    data: {
      status: input.status,
      registrarReference: input.registrarReference,
      expiresAt: input.expiresAt,
      verifiedAt: input.verifiedAt,
    },
  });
};
