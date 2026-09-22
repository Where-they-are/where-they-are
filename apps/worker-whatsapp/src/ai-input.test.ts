import { describe, expect, it } from "vitest";

import { buildIntakeMessage } from "./ai-input.js";
import type { NormalizedMessage } from "./types.js";

const baseMessage: NormalizedMessage = {
  id: "message-1",
  chatId: "263771234567@c.us",
  senderId: "263771234567@c.us",
  receivedAt: new Date("2026-09-22T10:00:00.000Z"),
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
      mediaKind: "image",
      media: { mimeType: "image/png", base64: "aW1hZ2U=" },
    });

    expect(result.content[1]).toEqual({
      type: "image",
      image: "data:image/png;base64,aW1hZ2U=",
      mimeType: "image/png",
    });
  });

  it("adds an audio file data URI for voice notes", () => {
    const result = buildIntakeMessage({
      ...baseMessage,
      text: "",
      mediaKind: "audio",
      media: { mimeType: "audio/ogg; codecs=opus", base64: "dm9pY2U=" },
    });

    expect(result.content[1]).toEqual({
      type: "file",
      data: "data:audio/ogg; codecs=opus;base64,dm9pY2U=",
      mimeType: "audio/ogg; codecs=opus",
    });
  });
});
