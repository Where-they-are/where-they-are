import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "where-they-are-server",
      timestamp: new Date().toISOString(),
    };
  }
}
