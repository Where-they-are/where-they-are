import { Inject, Module, type OnApplicationShutdown } from "@nestjs/common";

import { AGENT_CONFIG, type AgentConfig, readConfig } from "./config.js";
import { AdminController } from "./http/admin.controller.js";
import { AdminGuard } from "./http/admin.guard.js";
import { HealthController } from "./http/health.controller.js";
import { ANGEL_RUNTIME } from "./http/tokens.js";
import { type AngelRuntime, createRuntime } from "./runtime.js";
import { WhatsAppService } from "./whatsapp/whatsapp.service.js";

@Module({
	controllers: [HealthController, AdminController],
	providers: [
		{ provide: AGENT_CONFIG, useFactory: () => readConfig() },
		WhatsAppService,
		AdminGuard,
		{
			inject: [AGENT_CONFIG, WhatsAppService],
			provide: ANGEL_RUNTIME,
			useFactory: (config: AgentConfig, whatsapp: WhatsAppService) => {
				const runtime = createRuntime(config, whatsapp);
				whatsapp.attach(runtime);
				return runtime;
			},
		},
	],
})
export class AppModule implements OnApplicationShutdown {
	private readonly runtime: AngelRuntime;

	constructor(@Inject(ANGEL_RUNTIME) runtime: AngelRuntime) {
		this.runtime = runtime;
	}

	onApplicationShutdown(): void {
		this.runtime.crm.close();
	}
}
