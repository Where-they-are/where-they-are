import type { NormalizedMessage } from "./types.js";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; image: string; mimeType: string };
type FilePart = { type: "file"; data: string; mimeType: string };
type IntakePart = TextPart | ImagePart | FilePart;

export type IntakeMessage = {
  role: "user";
  content: IntakePart[];
};

const SYSTEM_CONTEXT = [
  "Extract factual business information from this WhatsApp message for a website intake.",
  "Never invent, infer, or improve facts that the customer did not provide.",
  "Treat unknown values as missing.",
  "For images, describe only what is visibly useful as an asset note; do not invent the business identity.",
  "For audio, listen to the voice note and extract only what the speaker says.",
  "The suggested reply must be concise, friendly, and ask only for missing information needed next.",
].join(" ");

const toDataUri = (mimeType: string, base64: string): string => `data:${mimeType};base64,${base64}`;

export const buildIntakeMessage = (message: NormalizedMessage): IntakeMessage => {
  const parts: IntakePart[] = [
    {
      type: "text",
      text: `${SYSTEM_CONTEXT}\n\nCustomer text:\n${message.text || "(no text accompanying the media)"}`,
    },
  ];

  if (message.media && message.mediaKind === "image") {
    parts.push({
      type: "image",
      image: toDataUri(message.media.mimeType, message.media.base64),
      mimeType: message.media.mimeType,
    });
  }

  if (message.media && message.mediaKind === "audio") {
    parts.push({
      type: "file",
      data: toDataUri(message.media.mimeType, message.media.base64),
      mimeType: message.media.mimeType,
    });
  }

  return { role: "user", content: parts };
};
