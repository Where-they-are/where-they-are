import type { Message } from "whatsapp-web.js";

import { type NormalizedMessage, normalizedMessageSchema } from "./types.js";

const classifyMedia = (
	mimeType: string,
	messageType: string
): NormalizedMessage["mediaKind"] => {
	if (mimeType.startsWith("image/")) {
		return "image";
	}

	if (
		mimeType.startsWith("audio/") ||
		messageType === "ptt" ||
		messageType === "audio"
	) {
		return "audio";
	}

	return "other";
};

export const normalizeMessage = async (
	message: Message
): Promise<NormalizedMessage> => {
	let media: NormalizedMessage["media"];
	let mediaKind: NormalizedMessage["mediaKind"];

	if (message.hasMedia) {
		const downloaded = await message.downloadMedia();

		if (downloaded) {
			media = {
				base64: downloaded.data,
				mimeType: downloaded.mimetype,
				...(downloaded.filename ? { filename: downloaded.filename } : {}),
			};
			mediaKind = classifyMedia(downloaded.mimetype, message.type);
		}
	}

	return normalizedMessageSchema.parse({
		chatId: message.from,
		id: message.id._serialized,
		media,
		mediaKind,
		receivedAt: new Date(message.timestamp * 1000),
		senderId: message.author ?? message.from,
		text: message.body,
	});
};
