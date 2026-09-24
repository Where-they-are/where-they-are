import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import {
	requireBusinessMember,
	TenantAccessError,
	type TenantRole,
} from "@where-they-are/db";
import type { Request } from "express";

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
		const userHeader = request.header("x-user-id");
		const businessHeader = request.header("x-business-id");
		const userId = typeof userHeader === "string" ? userHeader : undefined;
		const businessValue = request.params.businessId ?? businessHeader;
		const businessId =
			typeof businessValue === "string" ? businessValue : undefined;

		if (!(userId && businessId)) {
			throw new UnauthorizedException(
				"x-user-id and a businessId are required"
			);
		}

		let membership;

		try {
			membership = await requireBusinessMember(businessId, userId);
		} catch (error) {
			if (error instanceof TenantAccessError) {
				throw new ForbiddenException(error.message);
			}

			throw error;
		}
		request.principal = {
			businessId,
			role: membership.role,
			userId,
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
