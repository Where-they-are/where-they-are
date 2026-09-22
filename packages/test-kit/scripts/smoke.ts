import { ServerClient } from "@where-they-are/server-client";

import { assertJson, assertOk } from "../src/assertions.js";
import { smokeGenerateRequest } from "../src/smoke/fixtures.js";

type SmokeOptions = {
  serverBaseUrl: string;
  siteOriginBaseUrl: string;
};

const options: SmokeOptions = {
  serverBaseUrl: process.env.SERVER_BASE_URL ?? "http://localhost:3100",
  siteOriginBaseUrl: process.env.SITE_ORIGIN_BASE_URL ?? "http://localhost:3103",
};

const run = async (): Promise<void> => {
  const client = new ServerClient({ baseUrl: options.serverBaseUrl });
  const health = await client.getHealth();
  if (health.status !== "ok") {
    throw new Error(`Unexpected server health status: ${health.status}`);
  }

  const generated = await client.generateSite(smokeGenerateRequest);
  if (!generated.releaseId || !generated.previewSlug) {
    throw new Error("Generation response did not contain release identifiers");
  }

  const serverPreview = await fetch(client.previewUrl(generated.previewSlug));
  await assertOk(serverPreview, "central preview");
  const serverHtml = await serverPreview.text();
  if (!serverHtml.includes("Smoke Test Barber")) {
    throw new Error("Central preview did not contain the business name");
  }
  if (serverPreview.headers.get("x-robots-tag") !== "noindex, nofollow") {
    throw new Error("Central preview is missing noindex protection");
  }

  const originPreview = await fetch(
    `${options.siteOriginBaseUrl}/preview/${encodeURIComponent(generated.previewSlug)}`,
  );
  await assertOk(originPreview, "site-origin preview proxy");
  const originHtml = await originPreview.text();
  if (!originHtml.includes("Smoke Test Barber")) {
    throw new Error("Site-origin preview did not contain the business name");
  }

  console.info(JSON.stringify({
    status: "passed",
    server: options.serverBaseUrl,
    siteOrigin: options.siteOriginBaseUrl,
    releaseId: generated.releaseId,
    previewSlug: generated.previewSlug,
  }, null, 2));
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
