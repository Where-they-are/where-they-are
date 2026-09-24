import { type FieldErrors, isValidPhone, parseMileage } from "@/lib/validation";

export const TRADE_IN_CONDITIONS = ["Excellent", "Good", "Needs work"] as const;
export type TradeInCondition = (typeof TRADE_IN_CONDITIONS)[number];

export const TRADE_IN_MAKES = [
	"Toyota",
	"Honda",
	"Nissan",
	"Mazda",
	"Mercedes-Benz",
	"Ford",
	"Isuzu",
	"Mitsubishi",
	"Volkswagen",
	"Other",
] as const;

const OLDEST_TRADE_IN_YEAR = 2000;
const NEWEST_TRADE_IN_YEAR = 2026;

export const TRADE_IN_YEARS = Array.from(
	{ length: NEWEST_TRADE_IN_YEAR - OLDEST_TRADE_IN_YEAR + 1 },
	(_, index) => NEWEST_TRADE_IN_YEAR - index
);

export interface TradeInDetails {
	condition: TradeInCondition | "";
	make: string;
	mileage: string;
	model: string;
	whatsapp: string;
	year: string;
}

export const emptyTradeIn: TradeInDetails = {
	condition: "",
	make: "",
	mileage: "",
	model: "",
	whatsapp: "",
	year: "",
};

export type TradeInField = keyof TradeInDetails;

export const validateTradeIn = (
	details: TradeInDetails
): FieldErrors<TradeInField> => {
	const errors: FieldErrors<TradeInField> = {};
	if (!details.make) {
		errors.make = "Choose the make.";
	}
	if (details.model.trim().length < 2) {
		errors.model = "Enter the model, like Fortuner 2.8 GD-6.";
	}
	if (!details.year) {
		errors.year = "Choose the year.";
	}
	if (parseMileage(details.mileage) === undefined) {
		errors.mileage = "Enter the mileage in km, like 96,000.";
	}
	if (!details.condition) {
		errors.condition = "Choose the condition.";
	}
	if (!isValidPhone(details.whatsapp)) {
		errors.whatsapp = "Enter a full WhatsApp number, like +263 77 123 4567.";
	}
	return errors;
};

export const tradeInSummary = (details: TradeInDetails): string => {
	const km = parseMileage(details.mileage);
	const parts = [
		km === undefined ? "" : `${new Intl.NumberFormat("en-US").format(km)} km`,
		details.condition ? `${details.condition} condition` : "",
	].filter(Boolean);
	return parts.join(" · ");
};

const DRAFT_KEY = "ridgeline:trade-in-draft";

/** Keeps step 1 for the sell page, in this browser tab only. */
export const saveTradeInDraft = (details: TradeInDetails): void => {
	try {
		window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
	} catch {
		// Storage can be unavailable; the sell page then starts at step 1.
	}
};

const isCondition = (value: unknown): value is TradeInCondition =>
	TRADE_IN_CONDITIONS.includes(value as TradeInCondition);

export const loadTradeInDraft = (): TradeInDetails | undefined => {
	try {
		const raw = window.sessionStorage.getItem(DRAFT_KEY);
		if (!raw) {
			return;
		}
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		const text = (key: string) =>
			typeof parsed[key] === "string" ? (parsed[key] as string) : "";
		return {
			condition: isCondition(parsed.condition) ? parsed.condition : "",
			make: text("make"),
			mileage: text("mileage"),
			model: text("model"),
			whatsapp: text("whatsapp"),
			year: text("year"),
		};
	} catch {
		// Unreadable or unavailable storage: start the form empty.
	}
};

export const clearTradeInDraft = (): void => {
	try {
		window.sessionStorage.removeItem(DRAFT_KEY);
	} catch {
		// Nothing to clear.
	}
};
