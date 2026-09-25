import { Controller, Get, Inject } from "@nestjs/common";

import { WhatsAppService } from "../whatsapp/whatsapp.service.js";

/** Public liveness check; reveals no customer data. */
@Controller("health")
export class HealthController {
	private readonly whatsapp: WhatsAppService;

	constructor(@Inject(WhatsAppService) whatsapp: WhatsAppService) {
		this.whatsapp = whatsapp;
	}

	@Get()
	health() {
		return {
			ok: true,
			uptimeSeconds: Math.round(process.uptime()),
			whatsapp: this.whatsapp.state,
		};
	}
}
