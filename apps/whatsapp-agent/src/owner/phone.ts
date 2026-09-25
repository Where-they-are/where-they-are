const NON_DIGITS = /\D/g;
const ZIMBABWE_CODE = "263";
const LOCAL_MOBILE_LENGTH = 10;

/**
 * Normalises a phone number to international digits. Local Zimbabwe numbers
 * such as 0771 234 567 become 263771234567.
 */
export const normalizePhone = (value: string): string => {
	const digits = value.replace(NON_DIGITS, "");
	if (digits.startsWith("0") && digits.length === LOCAL_MOBILE_LENGTH) {
		return `${ZIMBABWE_CODE}${digits.slice(1)}`;
	}
	return digits;
};

/** "263771234567@c.us" -> "263771234567"; anything else yields undefined. */
export const phoneFromChatId = (chatId: string): string | undefined => {
	const [user, server] = chatId.split("@");
	return server === "c.us" && user ? normalizePhone(user) : undefined;
};

export const toChatId = (phone: string): string =>
	`${normalizePhone(phone)}@c.us`;
