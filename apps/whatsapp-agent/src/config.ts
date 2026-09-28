import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import type { ReasoningEffort } from "./agent/angel.js";

const TRAILING_SLASH = /\/+$/;

/** Where Linux installs Chromium; Docker uses the first one. */
const CHROMIUM_PATHS = [
	"/usr/bin/chromium",
	"/usr/bin/chromium-browser",
	"/usr/bin/google-chrome",
];

/**
 * Settings that never change between deployments. Only secrets and
 * account-specific values come from the environment.
 */
const SETTINGS = {
	AGENT_MODEL: "google/gemini-3.8-flash",
	AGENT_PORT: 3104,
	AGENT_REASONING_EFFORT: "low" as ReasoningEffort,
	/** Approved example posts Angel may share; empty until examples exist. */
	EXAMPLES_URL: "",
	HUMAN_TAKEOVER_HOURS: 12,
	/** Growth and Pro are 50% off the first month for the first five dealerships. */
	LAUNCH_OFFER_PLACES: 5,
	LAUNCH_PLACES_USED_OFFSET: 0,
	MAX_REPLIES_PER_HOUR: 30,
	META_TEST_EVENT_CODE: "",
	META_WHATSAPP_BUSINESS_ACCOUNT_ID: "",
	/** Receives hand-off alerts and sends #commands. */
	OWNER_WHATSAPP_NUMBER: "263789859332",
	/** Where a customer lands after paying on Paynow's page: back in our chat. */
	PAYNOW_RETURN_URL: "https://wa.me/263775101506",
	/** Several quick messages within this window get one answer. */
	REPLY_DEBOUNCE_MS: 3500,
	WHATSAPP_CLIENT_ID: "angel",
	WHATSAPP_ENABLED: true,
	/** The business number, linked with an 8-character pairing code. */
	WHATSAPP_PAIRING_NUMBER: "263775101506",
} as const;

const environmentSchema = z.object({
	/** Empty disables the admin API. */
	ADMIN_TOKEN: z.string().optional().default(""),
	/** The Dockerfile points this at the /data volume. */
	AGENT_DATA_DIR: z.string().min(1).default("./data"),
	META_CAPI_TOKEN: z.string().optional().default(""),
	META_DATASET_ID: z.string().optional().default(""),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
	/** The Paynow login email; Paynow requires it on mobile money prompts. */
	PAYNOW_AUTH_EMAIL: z.string().optional().default(""),
	/** Empty ID or key turns payments off: Angel hands the close to the owner. */
	PAYNOW_INTEGRATION_ID: z.string().optional().default(""),
	PAYNOW_INTEGRATION_KEY: z.string().optional().default(""),
	/** Angel's public address, for Paynow's result URL. Empty means polling only. */
	PUBLIC_BASE_URL: z
		.string()
		.optional()
		.default("")
		.transform((value) => value.replace(TRAILING_SLASH, "")),
});

export type AgentConfig = z.infer<typeof environmentSchema> &
	typeof SETTINGS & {
		/** The system Chromium in Docker; empty lets Puppeteer use its own. */
		CHROME_EXECUTABLE_PATH: string;
		WHATSAPP_AUTH_PATH: string;
	};

export const readConfig = (
	environment: NodeJS.ProcessEnv = process.env
): AgentConfig => {
	const parsed = environmentSchema.safeParse(environment);
	if (!parsed.success) {
		throw new Error(
			`Invalid WhatsApp agent configuration: ${parsed.error.message}`
		);
	}
	return {
		...SETTINGS,
		...parsed.data,
		CHROME_EXECUTABLE_PATH:
			CHROMIUM_PATHS.find((path) => existsSync(path)) ?? "",
		WHATSAPP_AUTH_PATH: resolve(parsed.data.AGENT_DATA_DIR, "wwebjs_auth"),
	};
};

/** Injection token for the parsed configuration. */
export const AGENT_CONFIG = Symbol("AGENT_CONFIG");
