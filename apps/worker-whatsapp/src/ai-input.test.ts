import { describe, expect, it } from "vitest";

import { buildIntakeMessage } from "./ai-input.js";
import type { NormalizedMessage } from "./types.js";

const baseMessage: NormalizedMessage = {
	chatId: "263771234567@c.us",
	id: "message-1",
	receivedAt: new Date("2026-09-22T10:00:00.000Z"),
	senderId: "263771234567@c.us",
	text: "We are a salon in Harare.",
};

describe("buildIntakeMessage", () => {
	it("builds a text-only user message", () => {
		const result = buildIntakeMessage(baseMessage);

		expect(result.role).toBe("user");
		expect(result.content).toHaveLength(1);
		expect(result.content[0]).toMatchObject({ type: "text" });
	});

	it("adds an image data URI for image media", () => {
		const result = buildIntakeMessage({
			...baseMessage,
			media: { base64: "aW1hZ2U=", mimeType: "image/png" },
			mediaKind: "image",
		});

		expect(result.content[1]).toEqual({
			image: "data:image/png;base64,aW1hZ2U=",
			mimeType: "image/png",
			type: "image",
		});
	});

	it("adds an audio file data URI for voice notes", () => {
		const result = buildIntakeMessage({
			...baseMessage,
			media: { base64: "dm9pY2U=", mimeType: "audio/ogg; codecs=opus" },
			mediaKind: "audio",
			text: "",
		});

		expect(result.content[1]).toEqual({
			data: "data:audio/ogg; codecs=opus;base64,dm9pY2U=",
			mimeType: "audio/ogg; codecs=opus",
			type: "file",
		});
	});
});
