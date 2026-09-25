import type { Message } from "whatsapp-web.js";

import type {
	IncomingMessage,
	MediaKind,
} from "../conversation/conversation.service.js";

/** Chats Angel never answers: groups, status updates, channels, broadcasts. */
const IGNORED_CHAT = /@(g\.us|broadcast|newsletter)$|^status@/;

/** WhatsApp system and bookkeeping message types with nothing to answer. */
const IGNORED_TYPES = new Set([
	"e2e_notification",
	"notification",
	"notification_template",
	"gp2",
	"call_log",
	"protocol",
	"revoked",
	"ciphertext",
	"reaction",
	"poll_creation",
]);

export const isIgnoredChat = (chatId: string): boolean =>
	IGNORED_CHAT.test(chatId);

export const isIgnoredType = (type: string): boolean => IGNORED_TYPES.has(type);

const mediaKindFor = (type: string, mimeType: string): MediaKind => {
	if (type === "image" || mimeType.startsWith("image/")) {
		return "image";
	}
	if (type === "ptt" || type === "audio" || mimeType.startsWith("audio/")) {
		return "audio";
	}
	if (type === "document") {
		return "document";
	}
	return "other";
};

/** Text-only messages that still carry meaning. */
const describeNonMedia = (message: Message): string => {
	if (message.type === "location" && message.location) {
		const { description, latitude, longitude } = message.location;
		return `(Shared a location${description ? `: ${description}` : ""} at ${latitude}, ${longitude})`;
	}
	if (message.type === "vcard" || message.type === "multi_vcard") {
		return "(Shared a contact card)";
	}
	return message.body;
};

/**
 * Turns a WhatsApp Web message into Angel's input. Media that cannot be
 * downloaded is described in text so the conversation can continue.
 */
export const toIncomingMessage = async (
	message: Message
): Promise<IncomingMessage> => {
	if (!message.hasMedia) {
		return { text: describeNonMedia(message) };
	}
	const caption = message.body;
	if (message.type === "sticker") {
		return { text: caption || "(Sent a sticker)" };
	}
	try {
		const media = await message.downloadMedia();
		if (!media?.data) {
			return {
				text: `${caption} (Sent a ${message.type} that could not be downloaded)`.trim(),
			};
		}
		return {
			media: {
				base64: media.data,
				mimeType: media.mimetype,
				...(media.filename ? { filename: media.filename } : {}),
			},
			mediaKind: mediaKindFor(message.type, media.mimetype),
			text: caption,
		};
	} catch {
		return {
			text: `${caption} (Sent a ${message.type} that could not be downloaded)`.trim(),
		};
	}
};
