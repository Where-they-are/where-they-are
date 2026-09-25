import { z } from "zod";

const booleanString = z
	.enum(["true", "false"])
	.default("true")
	.transform((value) => value === "true");

const digits = (value: string) => value.replace(/\D/g, "");
const TRAILING_SLASH = /\/+$/;

const configSchema = z.object({
	ADMIN_TOKEN: z.string().optional().default(""),
	AGENT_DATA_DIR: z.string().min(1).default("./data"),
	AGENT_MODEL: z.string().min(1).default("google/gemini-3.8-flash"),
	AGENT_PORT: z.coerce.number().int().positive().default(3104),
	AGENT_REASONING_EFFORT: z
		.enum(["minimal", "low", "medium", "high"])
		.default("low"),
	CHROME_EXECUTABLE_PATH: z.string().optional().default(""),
	DEALERSHIP_EARLY_PRICE_SLOTS: z.coerce.number().int().min(0).default(5),
	DEALERSHIP_EARLY_PRICE_USD: z.coerce.number().positive().default(250),
	DEALERSHIP_EARLY_SLOTS_USED_OFFSET: z.coerce.number().int().min(0).default(0),
	DEALERSHIP_STANDARD_PRICE_USD: z.coerce.number().positive().default(400),
	DEMO_SITE_URL: z
		.string()
		.url()
		.default("https://dealership-demo.wheretheyare.co.zw"),
	HUMAN_TAKEOVER_HOURS: z.coerce.number().positive().default(12),
	MAX_REPLIES_PER_HOUR: z.coerce.number().int().positive().default(30),
	META_CAPI_TOKEN: z.string().optional().default(""),
	META_DATASET_ID: z.string().optional().default(""),
	META_TEST_EVENT_CODE: z.string().optional().default(""),
	META_WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional().default(""),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
	OWNER_WHATSAPP_NUMBER: z
		.string()
		.transform(digits)
		.pipe(z.string().min(9, "OWNER_WHATSAPP_NUMBER must be a full number")),
	PAYNOW_AUTH_EMAIL: z.string().optional().default(""),
	PAYNOW_INTEGRATION_ID: z.string().optional().default(""),
	PAYNOW_INTEGRATION_KEY: z.string().optional().default(""),
	/** Angel's public address, e.g. https://angel.wheretheyare.co.zw, for Paynow's result URL. */
	PUBLIC_BASE_URL: z
		.string()
		.optional()
		.default("")
		.transform((value) => value.replace(TRAILING_SLASH, "")),
	REPLY_DEBOUNCE_MS: z.coerce.number().int().min(0).default(3500),
	WHATSAPP_AUTH_PATH: z.string().min(1).default("./data/wwebjs_auth"),
	WHATSAPP_CLIENT_ID: z.string().min(1).default("angel"),
	WHATSAPP_ENABLED: booleanString,
	WHATSAPP_PAIRING_NUMBER: z.string().optional().default("").transform(digits),
});

export type AgentConfig = z.infer<typeof configSchema>;

export const readConfig = (
	environment: NodeJS.ProcessEnv = process.env
): AgentConfig => {
	const parsed = configSchema.safeParse(environment);
	if (!parsed.success) {
		throw new Error(
			`Invalid WhatsApp agent configuration: ${parsed.error.message}`
		);
	}
	return parsed.data;
};

/** Injection token for the parsed configuration. */
export const AGENT_CONFIG = Symbol("AGENT_CONFIG");
