import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
	@Get()
	getHealth() {
		return {
			service: "where-they-are-server",
			status: "ok",
			timestamp: new Date().toISOString(),
		};
	}
}
