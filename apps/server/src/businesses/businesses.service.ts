import { Injectable } from "@nestjs/common";
import {
  addBusinessMember,
  createSite,
  findBusinessForMember,
  requireBusinessRole,
} from "@where-they-are/db";

@Injectable()
export class BusinessesService {
  public async getBusiness(businessId: string, userId: string) {
    return findBusinessForMember(businessId, userId);
  }

  public async addMember(input: {
    businessId: string;
    actorUserId: string;
    userId: string;
    role?: "OWNER" | "STAFF" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN";
  }) {
    await requireBusinessRole(input.businessId, input.actorUserId, ["OWNER", "ADMIN", "SUPER_ADMIN"]);
    return addBusinessMember({
      businessId: input.businessId,
      userId: input.userId,
      role: input.role,
    });
  }

  public async createSite(input: {
    businessId: string;
    actorUserId: string;
    name: string;
    slug: string;
    plan?: "STARTER" | "GROWTH" | "PREMIUM";
    template?: "SERVICE_PRO" | "HOSPITALITY" | "EVENTS_COMMUNITY";
  }) {
    await requireBusinessRole(input.businessId, input.actorUserId, ["OWNER", "ADMIN", "SUPER_ADMIN"]);
    return createSite(input);
  }
}
