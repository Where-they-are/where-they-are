import type { PaymentMethod } from "../crm/crm.types.js";
import { normalizePhone } from "../owner/phone.js";

const ZIMBABWE_MOBILE = /^2637\d{8}$/;

/** Mobile network prefixes (after 263) and the wallet each one uses. */
const WALLET_BY_PREFIX: Record<string, PaymentMethod> = {
	"71": "onemoney",
	"77": "ecocash",
	"78": "ecocash",
};

export type WalletCheck =
	| { method: PaymentMethod; ok: true; phone: string }
	| { ok: false; problem: "not_a_zimbabwe_mobile" | "unsupported_network" };

/**
 * Checks a wallet number and works out the wallet: Econet (077/078) numbers
 * use EcoCash and NetOne (071) numbers use OneMoney. An explicit method wins,
 * for customers who know better.
 */
export const checkWallet = (
	phone: string,
	method?: PaymentMethod
): WalletCheck => {
	const normalized = normalizePhone(phone);
	if (!ZIMBABWE_MOBILE.test(normalized)) {
		return { ok: false, problem: "not_a_zimbabwe_mobile" };
	}
	const detected = WALLET_BY_PREFIX[normalized.slice(3, 5)];
	const chosen = method ?? detected;
	if (!chosen) {
		return { ok: false, problem: "unsupported_network" };
	}
	return { method: chosen, ok: true, phone: normalized };
};
