import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { readConfig } from "./config.js";

const bootstrap = async (): Promise<void> => {
	const config = readConfig();
	const app = await NestFactory.create(AppModule, {
		logger: ["log", "warn", "error"],
	});
	app.setGlobalPrefix("api");
	app.enableShutdownHooks();
	await app.listen(config.AGENT_PORT, "0.0.0.0");
	new Logger("Angel").log(
		`Angel listening on port ${config.AGENT_PORT} (model ${config.AGENT_MODEL})`
	);
};

bootstrap().catch((error: unknown) => {
	console.error("Angel failed to start", error);
	process.exitCode = 1;
});
