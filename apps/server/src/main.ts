import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { readServerConfig } from "./config/config.js";

const bootstrap = async (): Promise<void> => {
	const config = readServerConfig();
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix("api");
	app.enableCors({
		credentials: true,
		origin: config.PORTAL_ORIGIN,
	});

	await app.listen(config.SERVER_PORT, "0.0.0.0");
	console.info(`Where They Are server listening on port ${config.SERVER_PORT}`);
};

void bootstrap();
