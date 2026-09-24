import { z } from "zod";

const configSchema = z.object({
	CHROME_EXECUTABLE_PATH: z.string().optional(),
	JEV_ENABLED: z
		.enum(["true", "false"])
		.default("true")
		.transform((value) => value === "true"),
	JEV_FAIL_OPEN: z
		.enum(["true", "false"])
		.default("true")
		.transform((value) => value === "true"),
	JEV_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.75),
	JEV_MODEL: z.string().default("~typesafe/jev-latest"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
	OPENROUTER_MODEL: z.string().default("google/gemini-3-flash-preview"),
	SERVER_BASE_URL: z.string().url().default("http://localhost:3100"),
	WHATSAPP_AUTH_PATH: z.string().min(1).default(".wwebjs_auth"),
	WHATSAPP_CLIENT_ID: z.string().min(1).default("wheretheyare"),
	WHATSAPP_WORKER_PORT: z.coerce.number().int().positive().default(3101),
});

export type WorkerConfig = z.infer<typeof configSchema>;

export const readConfig = (
	environment: NodeJS.ProcessEnv = process.env
): WorkerConfig => {
	const parsed = configSchema.safeParse(environment);

	if (!parsed.success) {
		throw new Error(
			`Invalid WhatsApp worker configuration: ${parsed.error.message}`
		);
	}

	return parsed.data;
};
