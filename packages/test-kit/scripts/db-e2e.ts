import { findReleaseForBusiness, db } from "@where-they-are/db";

type JsonResponse = Record<string, any>;

const serverBaseUrl = process.env.SERVER_BASE_URL ?? "http://localhost:3100";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const requestJson = async (path: string, init: RequestInit = {}): Promise<JsonResponse> => {
  const response = await fetch(`${serverBaseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed with ${response.status}: ${body}`);
  }

  return body ? (JSON.parse(body) as JsonResponse) : {};
};

const run = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be loaded before running test:e2e:db");
  }

  let firstBusinessId = "";
  let secondBusinessId = "";

  try {
    const first = await requestJson("/api/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify({
        email: `e2e-owner-${suffix}@example.test`,
        displayName: "E2E Owner",
        businessName: `E2E Business ${suffix}`,
        businessSlug: `e2e-business-${suffix}`,
        category: "barber",
        location: "Harare",
      }),
    });
    firstBusinessId = first.business.id as string;
    const firstOwnerId = first.owner.id as string;

    const site = await requestJson(`/api/businesses/${firstBusinessId}/sites`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({
        name: "E2E Brochure Site",
        slug: `e2e-site-${suffix}`,
        plan: "STARTER",
        template: "SERVICE_PRO",
      }),
    });

    const generated = await requestJson(
      `/api/businesses/${firstBusinessId}/sites/${site.id}/generate`,
      {
        method: "POST",
        headers: { "x-user-id": firstOwnerId },
        body: JSON.stringify({
          intake: {
            intent: "new_lead",
            businessName: `E2E Business ${suffix}`,
            businessCategory: "barber",
            description: "A test business for release persistence.",
            services: ["Haircuts"],
            location: "Harare",
            phone: "+263771234567",
            whatsapp: "+263771234567",
            operatingHours: null,
            factualClaims: ["Serving Harare"],
            assetNotes: [],
            missingFields: [],
            suggestedReply: "Your preview is ready.",
          },
          plan: "starter",
          intakeMessageIds: [`e2e-message-${suffix}`],
        }),
      },
    );

    const release = await findReleaseForBusiness(firstBusinessId, generated.releaseId as string);
    if (!release) {
      throw new Error("Generated release metadata was not persisted for the owning business");
    }
    if (release.siteId !== site.id) {
      throw new Error("Generated release is attached to the wrong site");
    }

    const preview = await fetch(`${serverBaseUrl}/api/previews/${generated.previewSlug}`);
    const previewHtml = await preview.text();
    if (!preview.ok || !previewHtml.includes(`E2E Business ${suffix}`)) {
      throw new Error("Persisted release preview was not retrievable through the API");
    }

    const second = await requestJson("/api/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify({
        email: `e2e-other-${suffix}@example.test`,
        displayName: "Other Owner",
        businessName: `Other Business ${suffix}`,
        businessSlug: `other-business-${suffix}`,
      }),
    });
    secondBusinessId = second.business.id as string;
    const secondOwnerId = second.owner.id as string;

    const crossTenant = await fetch(`${serverBaseUrl}/api/businesses/${firstBusinessId}/sites`, {
      headers: { "x-user-id": secondOwnerId },
    });
    if (crossTenant.status !== 403) {
      throw new Error(`Expected cross-tenant access to return 403, got ${crossTenant.status}`);
    }

    console.info(JSON.stringify({
      status: "passed",
      businessId: firstBusinessId,
      siteId: site.id,
      releaseId: generated.releaseId,
      previewSlug: generated.previewSlug,
      crossTenantStatus: crossTenant.status,
    }, null, 2));
  } finally {
    if (secondBusinessId) {
      await db.business.delete({ where: { id: secondBusinessId } });
    }
    if (firstBusinessId) {
      await db.business.delete({ where: { id: firstBusinessId } });
    }
    await db.$disconnect();
  }
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
