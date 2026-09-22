import { describe, expect, it, vi } from "vitest";

import { ServerClient } from "@where-they-are/server-client";

import { validGenerateRequest } from "../fixtures.js";

describe("ServerClient", () => {
  it("posts generation requests to the central NestJS API", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          releaseId: "release-1",
          previewSlug: "mbare-barber-studio-release",
          previewUrl: "http://localhost:3103/preview/mbare-barber-studio-release",
          specification: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const client = new ServerClient({ baseUrl: "http://localhost:3100/", fetcher });

    const result = await client.generateSite(validGenerateRequest);

    expect(result.releaseId).toBe("release-1");
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:3100/api/sites/generate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("creates encoded preview URLs", () => {
    const client = new ServerClient({ baseUrl: "http://localhost:3100" });

    expect(client.previewUrl("business name/release")).toBe(
      "http://localhost:3100/api/previews/business%20name%2Frelease",
    );
  });

  it("surfaces non-success responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("unavailable", { status: 503 }),
    );
    const client = new ServerClient({ baseUrl: "http://localhost:3100", fetcher });

    await expect(client.getHealth()).rejects.toThrow("503");
  });
});
