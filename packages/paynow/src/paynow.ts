import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Paynow (Zimbabwe) mobile checkout: the customer gets a USSD/PIN prompt on
 * their EcoCash or OneMoney wallet, and Paynow reports the result to our
 * result URL and through a poll URL. No card or wallet details pass through
 * our servers. Protocol: https://developers.paynow.co.zw
 */

export const PAYNOW_REMOTE_TRANSACTION_URL =
	"https://www.paynow.co.zw/interface/remotetransaction";

export const PAYNOW_MOBILE_METHODS = ["ecocash", "onemoney"] as const;
export type PaynowMobileMethod = (typeof PAYNOW_MOBILE_METHODS)[number];

/** Our summary of Paynow's many statuses. */
export type PaynowOutcome = "paid" | "pending" | "cancelled" | "failed";

export interface PaynowConfig {
	/**
	 * The merchant's Paynow login email. Paynow requires an email on mobile
	 * payments; in test mode it must be this email.
	 */
	authEmail: string;
	fetch?: typeof fetch;
	integrationId: string;
	integrationKey: string;
	/** Where Paynow POSTs status updates. */
	resultUrl: string;
	/** Where a browser would return after paying; unused by mobile checkout but required. */
	returnUrl: string;
	timeoutMs?: number;
}

export interface MobilePaymentRequest {
	amountUsd: number;
	/** Shown on the customer's statement, e.g. "Dealership website deposit". */
	description: string;
	method: PaynowMobileMethod;
	/** Wallet number in any format: 0771234567, 263771234567, +263 77 123 4567. */
	phone: string;
	/** Our unique reference for the transaction. */
	reference: string;
}

export type MobilePaymentResult =
	| {
			instructions: string | null;
			ok: true;
			paynowReference: string | null;
			pollUrl: string;
	  }
	| { error: string; ok: false };

export interface PaynowStatus {
	amount: number | null;
	outcome: PaynowOutcome;
	paynowReference: string | null;
	pollUrl: string | null;
	/** Paynow's own wording, e.g. "Awaiting Delivery". */
	providerStatus: string;
	reference: string | null;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const PAID_STATUSES = new Set(["paid", "awaiting delivery", "delivered"]);
const CANCELLED_STATUSES = new Set(["cancelled"]);
const FAILED_STATUSES = new Set(["failed", "disputed", "refunded"]);
const ZIMBABWE_PREFIX = "263";
const NON_DIGITS = /\D/g;

/** Paynow's integrity hash: SHA-512 of the values in order plus the key, upper-case hex. */
export const paynowHash = (values: string[], integrationKey: string): string =>
	createHash("sha512")
		.update(`${values.join("")}${integrationKey}`, "utf8")
		.digest("hex")
		.toUpperCase();

/** Checks the hash on a message from Paynow, using every field except the hash, in order. */
export const verifyPaynowHash = (
	fields: [string, string][],
	integrationKey: string
): boolean => {
	const received = fields.find(([key]) => key.toLowerCase() === "hash")?.[1];
	if (!received) {
		return false;
	}
	const expected = paynowHash(
		fields
			.filter(([key]) => key.toLowerCase() !== "hash")
			.map(([, value]) => value),
		integrationKey
	);
	const a = Buffer.from(expected);
	const b = Buffer.from(received.toUpperCase());
	return a.length === b.length && timingSafeEqual(a, b);
};

/** Paynow expects local wallet numbers: 0771234567. */
export const toLocalWalletNumber = (phone: string): string => {
	const digits = phone.replace(NON_DIGITS, "");
	if (digits.startsWith(ZIMBABWE_PREFIX)) {
		return `0${digits.slice(ZIMBABWE_PREFIX.length)}`;
	}
	return digits.startsWith("0") ? digits : `0${digits}`;
};

export const toOutcome = (providerStatus: string): PaynowOutcome => {
	const status = providerStatus.trim().toLowerCase();
	if (PAID_STATUSES.has(status)) {
		return "paid";
	}
	if (CANCELLED_STATUSES.has(status)) {
		return "cancelled";
	}
	if (FAILED_STATUSES.has(status)) {
		return "failed";
	}
	return "pending";
};

const fieldsOf = (body: string | URLSearchParams | Record<string, string>) => {
	const params =
		body instanceof URLSearchParams ? body : new URLSearchParams(body);
	return [...params.entries()];
};

const field = (fields: [string, string][], name: string): string | null =>
	fields.find(([key]) => key.toLowerCase() === name)?.[1] ?? null;

/**
 * Reads a status update, from the result URL POST or a poll response.
 * Returns null when the hash does not match: never trust such a message.
 */
export const parsePaynowStatus = (
	body: string | URLSearchParams | Record<string, string>,
	integrationKey: string
): PaynowStatus | null => {
	const fields = fieldsOf(body);
	if (!verifyPaynowHash(fields, integrationKey)) {
		return null;
	}
	const providerStatus = field(fields, "status") ?? "";
	const amount = Number(field(fields, "amount"));
	return {
		amount: Number.isFinite(amount) ? amount : null,
		outcome: toOutcome(providerStatus),
		paynowReference: field(fields, "paynowreference"),
		pollUrl: field(fields, "pollurl"),
		providerStatus,
		reference: field(fields, "reference"),
	};
};

export class PaynowClient {
	private readonly config: PaynowConfig;
	private readonly fetcher: typeof fetch;

	constructor(config: PaynowConfig) {
		this.config = config;
		this.fetcher = config.fetch ?? fetch;
	}

	/** Sends a payment prompt to the customer's wallet. */
	async requestMobilePayment(
		request: MobilePaymentRequest
	): Promise<MobilePaymentResult> {
		const fields: [string, string][] = [
			["resulturl", this.config.resultUrl],
			["returnurl", this.config.returnUrl],
			["reference", request.reference],
			["amount", request.amountUsd.toFixed(2)],
			["id", this.config.integrationId],
			["additionalinfo", request.description],
			["authemail", this.config.authEmail],
			["phone", toLocalWalletNumber(request.phone)],
			["method", request.method],
			["status", "Message"],
		];
		fields.push([
			"hash",
			paynowHash(
				fields.map(([, value]) => value),
				this.config.integrationKey
			),
		]);
		let text: string;
		try {
			text = await this.post(
				PAYNOW_REMOTE_TRANSACTION_URL,
				new URLSearchParams(fields)
			);
		} catch (error) {
			return { error: `Could not reach Paynow: ${String(error)}`, ok: false };
		}
		const response = fieldsOf(text);
		if (field(response, "status")?.toLowerCase() !== "ok") {
			return {
				error: field(response, "error") ?? "Paynow rejected the payment",
				ok: false,
			};
		}
		if (!verifyPaynowHash(response, this.config.integrationKey)) {
			return { error: "Paynow's reply failed the hash check", ok: false };
		}
		const pollUrl = field(response, "pollurl");
		if (!pollUrl) {
			return { error: "Paynow did not return a poll URL", ok: false };
		}
		return {
			instructions: field(response, "instructions"),
			ok: true,
			paynowReference: field(response, "paynowreference"),
			pollUrl,
		};
	}

	/** Asks Paynow for the latest status. Null when unreachable or unverifiable. */
	async poll(pollUrl: string): Promise<PaynowStatus | null> {
		try {
			return parsePaynowStatus(
				await this.post(pollUrl, new URLSearchParams()),
				this.config.integrationKey
			);
		} catch {
			return null;
		}
	}

	private async post(url: string, body: URLSearchParams): Promise<string> {
		const response = await this.fetcher(url, {
			body,
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			method: "POST",
			signal: AbortSignal.timeout(this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		return await response.text();
	}
}
