import type { Message } from "whatsapp-web.js";

import { normalizedMessageSchema, type NormalizedMessage } from "./types.js";

const classifyMedia = (mimeType: string, messageType: string): NormalizedMessage["mediaKind"] => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("audio/") || messageType === "ptt" || messageType === "audio") {
    return "audio";
  }

  return "other";
};

export const normalizeMessage = async (message: Message): Promise<NormalizedMessage> => {
  let media: NormalizedMessage["media"];
  let mediaKind: NormalizedMessage["mediaKind"];

  if (message.hasMedia) {
    const downloaded = await message.downloadMedia();

    if (downloaded) {
      media = {
        mimeType: downloaded.mimetype,
        base64: downloaded.data,
        ...(downloaded.filename ? { filename: downloaded.filename } : {}),
      };
      mediaKind = classifyMedia(downloaded.mimetype, message.type);
    }
  }

  return normalizedMessageSchema.parse({
    id: message.id._serialized,
    chatId: message.from,
    senderId: message.author ?? message.from,
    receivedAt: new Date(message.timestamp * 1000),
    text: message.body,
    media,
    mediaKind,
  });
};
