import { Injectable } from "@nestjs/common";
import {
  createDomain,
  findDomainForBusiness,
  listDomainsForBusiness,
  requireBusinessRole,
  updateDomainStatus,
} from "@where-they-are/db";

@Injectable()
export class DomainsService {
  public list(businessId: string) {
    return listDomainsForBusiness(businessId);
  }

  public get(businessId: string, domainId: string) {
    return findDomainForBusiness(businessId, domainId);
  }

  public async create(input: {
    businessId: string;
    actorUserId: string;
    siteId?: string;
    hostname: string;
    kind: "CO_ZW" | "CUSTOM";
  }) {
    await requireBusinessRole(input.businessId, input.actorUserId, ["OWNER", "ADMIN", "SUPER_ADMIN"]);
    return createDomain(input);
  }

  public async updateStatus(input: {
    businessId: string;
    actorUserId: string;
    domainId: string;
    status: "REQUESTED" | "PENDING_REGISTRATION" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
    registrarReference?: string;
    expiresAt?: Date | null;
    verifiedAt?: Date | null;
  }) {
    await requireBusinessRole(input.businessId, input.actorUserId, ["OWNER", "ADMIN", "SUPER_ADMIN"]);
    return updateDomainStatus(input);
  }
}
