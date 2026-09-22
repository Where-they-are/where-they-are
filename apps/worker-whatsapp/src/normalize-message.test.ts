import { describe, expect, it, vi } from "vitest";
import type { Message } from "whatsapp-web.js";

import { normalizeMessage } from "./normalize-message.js";

const createMessage = (overrides: Partial<Message> = {}): Message =>
  ({
    id: { _serialized: "message-1" },
    from: "263771234567@c.us",
    author: undefined,
    timestamp: 1_700_000_000,
    body: "Hello from WhatsApp",
    type: "chat",
    hasMedia: false,
    downloadMedia: vi.fn(),
    ...overrides,
  }) as unknown as Message;

describe("normalizeMessage", () => {
  it("normalizes a text message", async () => {
    const result = await normalizeMessage(createMessage());

    expect(result).toMatchObject({
      id: "message-1",
      chatId: "263771234567@c.us",
      senderId: "263771234567@c.us",
      text: "Hello from WhatsApp",
    });
    expect(result.media).toBeUndefined();
  });

  it("downloads and classifies an image attachment", async () => {
    const result = await normalizeMessage(
      createMessage({
        body: "Here is our logo",
        hasMedia: true,
        downloadMedia: vi.fn().mockResolvedValue({
          mimetype: "image/png",
          data: "aW1hZ2U=",
          filename: "logo.png",
        }),
      }),
    );

    expect(result.mediaKind).toBe("image");
    expect(result.media).toEqual({
      mimeType: "image/png",
      base64: "aW1hZ2U=",
      filename: "logo.png",
    });
  });

  it("classifies a WhatsApp voice note as audio", async () => {
    const result = await normalizeMessage(
      createMessage({
        body: "",
        hasMedia: true,
        downloadMedia: vi.fn().mockResolvedValue({
          mimetype: "audio/ogg; codecs=opus",
          data: "dm9pY2U=",
        }),
      }),
    );

    expect(result.mediaKind).toBe("audio");
    expect(result.media?.mimeType).toBe("audio/ogg; codecs=opus");
  });

  it("keeps the message valid when media can no longer be downloaded", async () => {
    const result = await normalizeMessage(
      createMessage({
        hasMedia: true,
        downloadMedia: vi.fn().mockResolvedValue(undefined),
      }),
    );

    expect(result.media).toBeUndefined();
    expect(result.mediaKind).toBeUndefined();
  });
});
