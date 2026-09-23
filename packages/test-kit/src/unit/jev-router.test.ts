import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JevClient,
  preflightSiteGeneration,
  preflightWhatsAppMessage,
} from "@where-they-are/jev-router";

const originalFetch = globalThis.fetch;

const policy = {
  enabled: true,
  failOpen: false,
  minConfidence: 0.75,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Jev OpenRouter client", () => {
  it("sends typed decisions and parses noul and choice answers", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "~typesafe/jev-latest",
          answers: {
            relevance: { type: "noul", noul: 0.96 },
            route: { type: "choice", choice: "site-intake" },
          },
        }),
      ),
    );
    globalThis.fetch = fetchMock;

    const client = new JevClient({ apiKey: "test-key", timeoutMs: 1000 });
    const response = await client.decide(
      { message: "We need a website for our cafe" },
      {
        relevance: {
          type: "noul",
          instructions: "Is this relevant?",
          criteria: { true: "Relevant", false: "Not relevant" },
        },
        route: {
          type: "choice",
          instructions: "Which route?",
          criteria: { "site-intake": "Website intake" },
        },
      },
    );

    expect(response.answers.relevance).toEqual({ type: "noul", noul: 0.96 });
    expect(response.answers.route).toEqual({ type: "choice", choice: "site-intake" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
  });

  it("blocks a non-intake WhatsApp route before Gemini extraction", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          answers: {
            relevance: { type: "noul", noul: 0.88 },
            route: { type: "choice", choice: "sales" },
          },
        }),
      ),
    );

    const result = await preflightWhatsAppMessage(
      new JevClient({ apiKey: "test-key" }),
      { body: "How much is Growth?" },
      policy,
    );

    expect(result).toEqual({
      allowed: false,
      route: "sales",
      relevance: 0.88,
      source: "jev",
    });
  });

  it("blocks site generation when relevance or grounding is below threshold", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          answers: {
            relevance: { type: "noul", noul: 0.92 },
            grounded: { type: "noul", noul: 0.51 },
          },
        }),
      ),
    );

    const result = await preflightSiteGeneration(
      new JevClient({ apiKey: "test-key" }),
      { businessName: "Example", services: [] },
      policy,
    );

    expect(result.allowed).toBe(false);
    expect(result.relevance).toBe(0.92);
    expect(result.grounded).toBe(0.51);
  });

  it("fails open when Jev is unavailable and policy allows it", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockRejectedValue(new Error("network unavailable"));

    const result = await preflightSiteGeneration(
      new JevClient({ apiKey: "test-key" }),
      { businessName: "Example" },
      { ...policy, failOpen: true },
    );

    expect(result).toEqual({
      allowed: true,
      relevance: 1,
      grounded: 1,
      source: "fallback",
    });
  });
});
