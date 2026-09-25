import {
	Body,
	Controller,
	HttpCode,
	Inject,
	Logger,
	Post,
} from "@nestjs/common";
import { parsePaynowStatus } from "@where-they-are/paynow";

import type { AngelRuntime } from "../runtime.js";
import { ANGEL_RUNTIME } from "./tokens.js";

/**
 * Paynow's result URL. Paynow POSTs every status change here; only messages
 * with a valid hash are acted on, and Angel also polls, so a missed or
 * rejected call never loses a payment.
 */
@Controller("paynow")
export class PaynowController {
	private readonly logger = new Logger("Paynow");
	private readonly runtime: AngelRuntime;

	constructor(@Inject(ANGEL_RUNTIME) runtime: AngelRuntime) {
		this.runtime = runtime;
	}

	@Post("result")
	@HttpCode(200)
	async result(@Body() body: Record<string, string> | undefined) {
		const key = this.runtime.config.PAYNOW_INTEGRATION_KEY;
		const status =
			key && body && typeof body === "object"
				? parsePaynowStatus(body, key)
				: null;
		if (!status) {
			this.logger.warn("Ignored a Paynow result with a missing or bad hash");
			return { ok: false };
		}
		const known = await this.runtime.payments.handleStatusUpdate(status);
		if (!known) {
			this.logger.warn(
				`Paynow result for unknown reference ${status.reference}`
			);
		}
		return { ok: known };
	}
}
