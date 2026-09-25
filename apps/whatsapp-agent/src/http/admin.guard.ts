import { timingSafeEqual } from "node:crypto";

import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { AGENT_CONFIG, type AgentConfig } from "../config.js";

const BEARER = /^Bearer\s+(.+)$/i;

const safeEqual = (a: string, b: string): boolean => {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * Protects the admin API with ADMIN_TOKEN (Authorization: Bearer <token>).
 * With no token configured the admin API does not exist at all.
 */
@Injectable()
export class AdminGuard implements CanActivate {
	private readonly token: string;

	constructor(@Inject(AGENT_CONFIG) config: AgentConfig) {
		this.token = config.ADMIN_TOKEN;
	}

	canActivate(context: ExecutionContext): boolean {
		if (!this.token) {
			throw new NotFoundException();
		}
		const request = context
			.switchToHttp()
			.getRequest<{ headers: Record<string, string | undefined> }>();
		const header = request.headers.authorization ?? "";
		const provided = BEARER.exec(header)?.[1] ?? "";
		if (!safeEqual(provided, this.token)) {
			throw new ForbiddenException("Invalid admin token");
		}
		return true;
	}
}
