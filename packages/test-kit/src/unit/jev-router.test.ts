import {
	JevClient,
	preflightSiteGeneration,
	preflightWhatsAppMessage,
} from "@where-they-are/jev-router";
import { afterEach, describe, expect, it, vi } from "vitest";

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
					answers: {
						relevance: { noul: 0.96, type: "noul" },
						route: { choice: "site-intake", type: "choice" },
					},
					model: "~typesafe/jev-latest",
				})
			)
		);
		globalThis.fetch = fetchMock;

		const client = new JevClient({ apiKey: "test-key", timeoutMs: 1000 });
		const response = await client.decide(
			{ message: "We need a website for our cafe" },
			{
				relevance: {
					criteria: { false: "Not relevant", true: "Relevant" },
					instructions: "Is this relevant?",
					type: "noul",
				},
				route: {
					criteria: { "site-intake": "Website intake" },
					instructions: "Which route?",
					type: "choice",
				},
			}
		);

		expect(response.answers.relevance).toEqual({ noul: 0.96, type: "noul" });
		expect(response.answers.route).toEqual({
			choice: "site-intake",
			type: "choice",
		});
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
						relevance: { noul: 0.88, type: "noul" },
						route: { choice: "sales", type: "choice" },
					},
				})
			)
		);

		const result = await preflightWhatsAppMessage(
			new JevClient({ apiKey: "test-key" }),
			{ body: "How much is Growth?" },
			policy
		);

		expect(result).toEqual({
			allowed: false,
			relevance: 0.88,
			route: "sales",
			source: "jev",
		});
	});

	it("blocks site generation when relevance or grounding is below threshold", async () => {
		globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(
				JSON.stringify({
					answers: {
						grounded: { noul: 0.51, type: "noul" },
						relevance: { noul: 0.92, type: "noul" },
					},
				})
			)
		);

		const result = await preflightSiteGeneration(
			new JevClient({ apiKey: "test-key" }),
			{ businessName: "Example", services: [] },
			policy
		);

		expect(result.allowed).toBe(false);
		expect(result.relevance).toBe(0.92);
		expect(result.grounded).toBe(0.51);
	});

	it("fails open when Jev is unavailable and policy allows it", async () => {
		globalThis.fetch = vi
			.fn<typeof fetch>()
			.mockRejectedValue(new Error("network unavailable"));

		const result = await preflightSiteGeneration(
			new JevClient({ apiKey: "test-key" }),
			{ businessName: "Example" },
			{ ...policy, failOpen: true }
		);

		expect(result).toEqual({
			allowed: true,
			grounded: 1,
			relevance: 1,
			source: "fallback",
		});
	});
});
