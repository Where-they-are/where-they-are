const NON_DIGITS = /\D/g;
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 15;
/** Zimbabwe national ID, e.g. "63-2214578 F 42". */
const NATIONAL_ID = /^\d{2}-\d{6,7}\s?[A-Z]\s?\d{2}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_MILEAGE_KM = 1_000_000;

export const digitsOnly = (value: string): string =>
	value.replace(NON_DIGITS, "");

export const isValidPhone = (value: string): boolean => {
	const digits = digitsOnly(value);
	return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
};

export const isValidNationalId = (value: string): boolean =>
	NATIONAL_ID.test(value.trim());

export const isValidEmail = (value: string): boolean =>
	EMAIL.test(value.trim());

/** "96,000 km" -> 96000; undefined when empty or out of range. */
export const parseMileage = (value: string): number | undefined => {
	const digits = digitsOnly(value);
	if (!digits) {
		return;
	}
	const km = Number.parseInt(digits, 10);
	return km <= MAX_MILEAGE_KM ? km : undefined;
};

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export const hasErrors = (errors: FieldErrors<string>): boolean =>
	Object.values(errors).some(Boolean);
