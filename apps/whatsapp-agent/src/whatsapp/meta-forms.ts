/**
 * Click-to-WhatsApp ads with a WhatsApp form: Meta sends a welcome message
 * and a completion message from the business number, and the lead's answers
 * arrive in the chat. whatsapp-web.js exposes neither officially, so this
 * module recognises Meta's automated messages (which must not look like the
 * owner replying by hand) and reads form answers defensively.
 */

/** What Meta sends from our number once a lead submits the ad form. */
export const FORM_COMPLETED_TEXT =
	"Thanks. We will review your answers and message you on WhatsApp with the next steps.";

/** The welcome and completion messages of the current dealership ad form. */
export const DEFAULT_AUTOMATED_TEXTS = [
	"Welcome! Please fill out the form below to sign up!",
	FORM_COMPLETED_TEXT,
];

/** What Angel sees when a lead submitted the form but its answers aren't readable. */
export const FORM_SUBMITTED_NOTE =
	"(Ad form submitted. Their answers didn't come through in this chat.)";

/** Message types a person types or sends by hand in WhatsApp. */
const HUMAN_TYPES = new Set([
	"chat",
	"image",
	"video",
	"audio",
	"ptt",
	"document",
	"sticker",
	"location",
	"vcard",
	"multi_vcard",
]);

const PUNCTUATION_AND_SPACE = /[\s.!,:;'"’‘-]+/g;

const normalise = (text: string) =>
	text.toLowerCase().replace(PUNCTUATION_AND_SPACE, " ").trim();

/**
 * True for messages sent from the business number by Meta or WhatsApp
 * automation (ad form welcome and completion, templates, buttons, forms)
 * rather than typed by the owner. These must not pause Angel.
 */
export const isAutomatedBusinessMessage = (
	message: { body: string; type: string },
	automatedTexts: readonly string[] = DEFAULT_AUTOMATED_TEXTS
): boolean => {
	if (!HUMAN_TYPES.has(message.type)) {
		return true;
	}
	const body = normalise(message.body);
	if (!body) {
		return false;
	}
	return automatedTexts.some((text) => {
		const known = normalise(text);
		return known.length > 0 && (body === known || body.startsWith(known));
	});
};

/** True for Meta's "thanks, we'll message you" once a lead submits the ad form. */
export const isFormCompletion = (body: string): boolean => {
	const text = normalise(body);
	return text.length > 0 && text.startsWith(normalise(FORM_COMPLETED_TEXT));
};

/** Fields in WhatsApp Web's raw message that may hold form or button text. */
const TEXT_KEYS = new Set([
	"body",
	"caption",
	"description",
	"displayText",
	"selectedDisplayText",
	"text",
	"title",
]);
const JSON_KEYS = new Set(["paramsJson", "responseJson", "response_json"]);
const MAX_DEPTH = 4;
const MAX_LINES = 20;
const INTERNAL_FIELD = /^(id|flow_token|version|screen)$/i;

const jsonLines = (json: string): string[] => {
	try {
		const parsed: unknown = JSON.parse(json);
		if (!parsed || typeof parsed !== "object") {
			return [];
		}
		return Object.entries(parsed as Record<string, unknown>)
			.filter(
				([key, value]) =>
					!INTERNAL_FIELD.test(key) &&
					(typeof value === "string" || typeof value === "number")
			)
			.map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`);
	} catch {
		return [];
	}
};

const collect = (value: unknown, depth: number, lines: string[]): void => {
	if (depth > MAX_DEPTH || lines.length >= MAX_LINES || !value) {
		return;
	}
	if (typeof value !== "object") {
		return;
	}
	for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
		if (typeof child === "string" && child.trim()) {
			if (JSON_KEYS.has(key)) {
				lines.push(...jsonLines(child));
			} else if (TEXT_KEYS.has(key) && !lines.includes(child.trim())) {
				lines.push(child.trim());
			}
		} else if (child && typeof child === "object") {
			collect(child, depth + 1, lines);
		}
	}
};

/**
 * Reads answers from a form or interactive message whose plain body is
 * empty, e.g. a WhatsApp form submitted from our ad. Returns null when
 * nothing readable is found.
 */
export const formAnswersFrom = (raw: unknown): string | null => {
	const lines: string[] = [];
	collect(raw, 0, lines);
	const text = lines.slice(0, MAX_LINES).join("\n").trim();
	return text ? text : null;
};
