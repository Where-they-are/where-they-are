import { createHash } from "node:crypto";

import type { AdSource } from "../crm/crm.types.js";

/** Graph API version for the Conversions API. */
export const META_GRAPH_VERSION = "v23.0";
const DEFAULT_TIMEOUT_MS = 10_000;
const NON_DIGITS = /\D/g;
const ZIMBABWE_COUNTRY_CODE = "zw";

/** Funnel events reported to Meta (docs/sales-script.md §7). */
export const META_EVENTS = [
	"QualifiedLead",
	"InitiateCheckout",
	"Purchase",
] as const;
export type MetaEventName = (typeof META_EVENTS)[number];

export interface MetaConversionsConfig {
	accessToken: string;
	datasetId: string;
	fetch?: typeof fetch;
	/** Events Manager test code; events then only show under Test events. */
	testEventCode?: string;
	timeoutMs?: number;
	/** Needed with ctwa_clid for business-messaging attribution. */
	whatsappBusinessAccountId?: string;
}

export interface MetaEvent {
	adSource: AdSource | null;
	/** Unique per event so Meta can deduplicate retries. */
	eventId: string;
	eventName: MetaEventName;
	eventTime: Date;
	/** International format, digits only. */
	phone: string;
	valueUsd?: number;
}

export type MetaSendResult = { ok: true } | { error: string; ok: false };

const sha256 = (value: string): string =>
	createHash("sha256").update(value.trim().toLowerCase(), "utf8").digest("hex");

/**
 * Builds one Conversions API event. Leads that came from a Click-to-WhatsApp
 * ad carry its click id and are attributed as business messaging; the rest
 * are matched on the hashed phone number.
 */
export const buildMetaEvent = (
	event: MetaEvent,
	whatsappBusinessAccountId?: string
): Record<string, unknown> => {
	const clickId = event.adSource?.ctwaClid;
	const userData: Record<string, unknown> = {
		country: [sha256(ZIMBABWE_COUNTRY_CODE)],
		ph: [sha256(event.phone.replace(NON_DIGITS, ""))],
	};
	const attribution: Record<string, unknown> = {};
	if (clickId) {
		userData.ctwa_clid = clickId;
		if (whatsappBusinessAccountId) {
			userData.whatsapp_business_account_id = whatsappBusinessAccountId;
		}
		attribution.action_source = "business_messaging";
		attribution.messaging_channel = "whatsapp";
	} else {
		attribution.action_source = "system_generated";
	}
	return {
		...attribution,
		...(event.valueUsd === undefined
			? {}
			: { custom_data: { currency: "USD", value: event.valueUsd } }),
		event_id: event.eventId,
		event_name: event.eventName,
		event_time: Math.floor(event.eventTime.getTime() / 1000),
		user_data: userData,
	};
};

/** Sends funnel events to Meta from the server. Never throws. */
export class MetaConversionsClient {
	private readonly config: MetaConversionsConfig;
	private readonly fetcher: typeof fetch;

	constructor(config: MetaConversionsConfig) {
		this.config = config;
		this.fetcher = config.fetch ?? fetch;
	}

	async send(event: MetaEvent): Promise<MetaSendResult> {
		const body = {
			access_token: this.config.accessToken,
			data: [buildMetaEvent(event, this.config.whatsappBusinessAccountId)],
			...(this.config.testEventCode
				? { test_event_code: this.config.testEventCode }
				: {}),
		};
		try {
			const response = await this.fetcher(
				`https://graph.facebook.com/${META_GRAPH_VERSION}/${this.config.datasetId}/events`,
				{
					body: JSON.stringify(body),
					headers: { "Content-Type": "application/json" },
					method: "POST",
					signal: AbortSignal.timeout(
						this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS
					),
				}
			);
			if (response.ok) {
				return { ok: true };
			}
			const text = await response.text();
			return {
				error: `Meta HTTP ${response.status}: ${text.slice(0, 300)}`,
				ok: false,
			};
		} catch (error) {
			return { error: `Could not reach Meta: ${String(error)}`, ok: false };
		}
	}
}
