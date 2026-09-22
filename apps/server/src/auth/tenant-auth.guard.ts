import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { requireBusinessMember, type TenantRole } from "@where-they-are/db";

export type TenantPrincipal = {
  userId: string;
  businessId: string;
  role: TenantRole;
};

type TenantRequest = Request & { principal?: TenantPrincipal };

@Injectable()
export class TenantAuthGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const userId = request.header("x-user-id");
    const businessId = request.params.businessId ?? request.header("x-business-id");

    if (!userId || !businessId) {
      throw new UnauthorizedException("x-user-id and a businessId are required");
    }

    const membership = await requireBusinessMember(businessId, userId);
    request.principal = {
      userId,
      businessId,
      role: membership.role,
    };

    return true;
  }
}

export const getTenantPrincipal = (request: TenantRequest): TenantPrincipal => {
  if (!request.principal) {
    throw new UnauthorizedException("Tenant principal is missing");
  }

  return request.principal;
};
