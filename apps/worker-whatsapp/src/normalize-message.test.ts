import { describe, expect, it, vi } from "vitest";
import type { Message } from "whatsapp-web.js";

import { normalizeMessage } from "./normalize-message.js";

const createMessage = (overrides: Partial<Message> = {}): Message =>
	({
		author: undefined,
		body: "Hello from WhatsApp",
		downloadMedia: vi.fn(),
		from: "263771234567@c.us",
		hasMedia: false,
		id: { _serialized: "message-1" },
		timestamp: 1_700_000_000,
		type: "chat",
		...overrides,
	}) as unknown as Message;

describe("normalizeMessage", () => {
	it("normalizes a text message", async () => {
		const result = await normalizeMessage(createMessage());

		expect(result).toMatchObject({
			chatId: "263771234567@c.us",
			id: "message-1",
			senderId: "263771234567@c.us",
			text: "Hello from WhatsApp",
		});
		expect(result.media).toBeUndefined();
	});

	it("downloads and classifies an image attachment", async () => {
		const result = await normalizeMessage(
			createMessage({
				body: "Here is our logo",
				downloadMedia: vi.fn().mockResolvedValue({
					data: "aW1hZ2U=",
					filename: "logo.png",
					mimetype: "image/png",
				}),
				hasMedia: true,
			})
		);

		expect(result.mediaKind).toBe("image");
		expect(result.media).toEqual({
			base64: "aW1hZ2U=",
			filename: "logo.png",
			mimeType: "image/png",
		});
	});

	it("classifies a WhatsApp voice note as audio", async () => {
		const result = await normalizeMessage(
			createMessage({
				body: "",
				downloadMedia: vi.fn().mockResolvedValue({
					data: "dm9pY2U=",
					mimetype: "audio/ogg; codecs=opus",
				}),
				hasMedia: true,
			})
		);

		expect(result.mediaKind).toBe("audio");
		expect(result.media?.mimeType).toBe("audio/ogg; codecs=opus");
	});

	it("keeps the message valid when media can no longer be downloaded", async () => {
		const result = await normalizeMessage(
			createMessage({
				downloadMedia: vi.fn().mockResolvedValue(undefined),
				hasMedia: true,
			})
		);

		expect(result.media).toBeUndefined();
		expect(result.mediaKind).toBeUndefined();
	});
});
