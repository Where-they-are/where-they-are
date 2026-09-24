const MAX_BUBBLES = 3;
/** Paragraphs shorter than this are joined to the next one, not sent alone. */
const MIN_BUBBLE_LENGTH = 90;
const URL_ONLY = /^\S*https?:\/\/\S+$/;
const MAX_REPLY_LENGTH = 1500;
const MARKDOWN_BOLD = /\*\*(.+?)\*\*/g;
const MARKDOWN_HEADING = /^#{1,6}\s+/gm;
const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const EXTRA_BLANK_LINES = /\n{3,}/g;
const TRAILING_SPACES = /[ \t]+$/gm;
const PARAGRAPH_BREAK = /\n\s*\n/;

/** Converts model markdown into WhatsApp formatting and trims it. */
export const toWhatsAppText = (text: string): string =>
	text
		.replace(MARKDOWN_LINK, "$1: $2")
		.replace(MARKDOWN_BOLD, "*$1*")
		.replace(MARKDOWN_HEADING, "")
		.replace(TRAILING_SPACES, "")
		.replace(EXTRA_BLANK_LINES, "\n\n")
		.trim()
		.slice(0, MAX_REPLY_LENGTH);

/**
 * Splits a reply into at most three chat bubbles at paragraph breaks, like a
 * person typing a couple of short messages instead of one block.
 */
export const splitIntoBubbles = (text: string): string[] => {
	const raw = toWhatsAppText(text)
		.split(PARAGRAPH_BREAK)
		.map((part) => part.trim())
		.filter(Boolean);
	const paragraphs: string[] = [];
	for (const part of raw) {
		const previous = paragraphs.at(-1);
		const introducesLink =
			(previous?.endsWith(":") ?? false) && URL_ONLY.test(part);
		const joinable =
			previous !== undefined &&
			(introducesLink ||
				(previous.length < MIN_BUBBLE_LENGTH &&
					!URL_ONLY.test(previous) &&
					!URL_ONLY.test(part)));
		if (joinable) {
			paragraphs[paragraphs.length - 1] = introducesLink
				? `${previous}\n${part}`
				: `${previous} ${part}`;
		} else {
			paragraphs.push(part);
		}
	}
	if (paragraphs.length <= MAX_BUBBLES) {
		return paragraphs;
	}
	const head = paragraphs.slice(0, MAX_BUBBLES - 1);
	const tail = paragraphs.slice(MAX_BUBBLES - 1).join("\n\n");
	return [...head, tail];
};

/** Typing time for a bubble: long enough to feel natural, never slow. */
export const typingDelayMs = (text: string): number =>
	Math.min(4000, Math.max(900, text.length * 25));
