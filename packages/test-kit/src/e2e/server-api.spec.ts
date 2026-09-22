import { expect, test } from "@playwright/test";

import { smokeGenerateRequest } from "../smoke/fixtures.js";

test.describe("central API", () => {
  test("reports healthy", async ({ request }) => {
    const baseUrl = process.env.SERVER_BASE_URL ?? "http://localhost:3100";
    const response = await request.get(`${baseUrl}/api/health`);

    expect(response.ok()).toBeTruthy();
    await expect(response).toBeOK();
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "where-they-are-server",
    });
  });

  test("generates a preview release from a validated intake", async ({ request }) => {
    const baseUrl = process.env.SERVER_BASE_URL ?? "http://localhost:3100";
    const response = await request.post(`${baseUrl}/api/sites/generate`, {
      data: smokeGenerateRequest,
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { releaseId: string; previewSlug: string; previewUrl: string };
    expect(body.releaseId).toBeTruthy();
    expect(body.previewSlug).toContain("smoke-test-barber");
    expect(body.previewUrl).toContain(body.previewSlug);

    const preview = await request.get(`${baseUrl}/api/previews/${body.previewSlug}`);
    expect(preview.ok()).toBeTruthy();
    expect(preview.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(await preview.text()).toContain("Smoke Test Barber");
  });
});
