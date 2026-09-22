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

const assertCondition = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be loaded before running test:e2e:db");
  }

  let firstBusinessId = "";
  let firstOwnerId = "";
  let secondBusinessId = "";
  let secondOwnerId = "";

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
    firstOwnerId = first.owner.id as string;

    const membership = await requestJson(
      `/api/auth/businesses/${firstBusinessId}/membership`,
      { headers: { "x-user-id": firstOwnerId } },
    );
    assertCondition(membership.id === firstBusinessId, "Owner membership lookup returned the wrong business");
    assertCondition(
      membership.memberships?.some(
        (member: { userId: string; role: string; status: string }) =>
          member.userId === firstOwnerId && member.role === "OWNER" && member.status === "ACTIVE",
      ) === true,
      "Owner membership was not active with OWNER role",
    );

    const business = await requestJson(`/api/businesses/${firstBusinessId}`, {
      headers: { "x-user-id": firstOwnerId },
    });
    assertCondition(business.id === firstBusinessId, "Business lookup returned the wrong tenant");

    const unauthorized = await fetch(`${serverBaseUrl}/api/businesses/${firstBusinessId}`);
    assertCondition(
      unauthorized.status === 401,
      `Expected missing tenant identity to return 401, got ${unauthorized.status}`,
    );

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

    assertCondition(site.businessId === firstBusinessId, "Created site is not owned by the first business");
    assertCondition(site.status === "DRAFT", `New site should be DRAFT, got ${site.status}`);

    const sites = await requestJson(`/api/businesses/${firstBusinessId}/sites`, {
      headers: { "x-user-id": firstOwnerId },
    });
    assertCondition(
      Array.isArray(sites) && sites.some((candidate: { id: string }) => candidate.id === site.id),
      "Created site was not returned by the tenant site list",
    );

    const siteDetail = await requestJson(`/api/businesses/${firstBusinessId}/sites/${site.id}`, {
      headers: { "x-user-id": firstOwnerId },
    });
    assertCondition(siteDetail.id === site.id, "Site detail lookup returned the wrong site");

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

    assertCondition(typeof generated.releaseId === "string", "Generation response is missing releaseId");
    assertCondition(typeof generated.previewSlug === "string", "Generation response is missing previewSlug");
    assertCondition(typeof generated.previewUrl === "string", "Generation response is missing previewUrl");
    assertCondition(generated.specification?.businessName === `E2E Business ${suffix}`, "Generated specification has the wrong business name");

    const updatedSite = await requestJson(`/api/businesses/${firstBusinessId}/sites/${site.id}`, {
      headers: { "x-user-id": firstOwnerId },
    });
    assertCondition(updatedSite.status === "PREVIEW", `Generated site should be PREVIEW, got ${updatedSite.status}`);
    assertCondition(updatedSite.previewSlug === generated.previewSlug, "Site preview slug was not persisted");

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

    const payment = await requestJson(`/api/businesses/${firstBusinessId}/payments`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({
        siteId: site.id,
        provider: "MANUAL",
        amount: "50.00",
        purpose: "WEBSITE",
        description: "E2E website payment",
      }),
    });
    await requestJson(`/api/businesses/${firstBusinessId}/payments/${payment.id}/status`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
    });

    const domain = await requestJson(`/api/businesses/${firstBusinessId}/domains`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ siteId: site.id, hostname: `e2e-${suffix}.co.zw`, kind: "CO_ZW" }),
    });
    await requestJson(`/api/businesses/${firstBusinessId}/domains/${domain.id}/status`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ status: "ACTIVE", verifiedAt: new Date().toISOString() }),
    });

    const subscription = await requestJson(`/api/businesses/${firstBusinessId}/billing/subscriptions`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({
        siteId: site.id,
        plan: "STARTER",
        amount: "5.00",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const invoice = await requestJson(`/api/businesses/${firstBusinessId}/billing/invoices`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ subscriptionId: subscription.id, amount: "5.00", description: "E2E hosting renewal" }),
    });
    await requestJson(`/api/businesses/${firstBusinessId}/billing/invoices/${invoice.id}/status`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
    });

    const feedback = await requestJson(`/api/businesses/${firstBusinessId}/sites/${site.id}/feedback`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({
        releaseId: generated.releaseId,
        type: "FACTUAL_CORRECTION",
        description: "Correct the E2E opening-hours wording.",
        dedupeKey: `e2e-feedback-${suffix}`,
      }),
    });
    assertCondition(feedback.status === "SUBMITTED", "Feedback was not submitted");

    const approval = await requestJson(`/api/businesses/${firstBusinessId}/sites/${site.id}/approve`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ releaseId: generated.releaseId }),
    });
    assertCondition(approval.status === "APPROVED", "Release approval was not recorded");

    const deployment = await requestJson(`/api/businesses/${firstBusinessId}/sites/${site.id}/publication/deployments`, {
      method: "POST",
      headers: { "x-user-id": firstOwnerId },
      body: JSON.stringify({ releaseId: generated.releaseId }),
    });
    await requestJson(
      `/api/businesses/${firstBusinessId}/sites/${site.id}/publication/deployments/${deployment.id}/status`,
      {
        method: "POST",
        headers: { "x-user-id": firstOwnerId },
        body: JSON.stringify({ status: "SUCCEEDED", finishedAt: new Date().toISOString() }),
      },
    );
    await db.site.update({
      where: { id: site.id },
      data: { status: "PUBLISHED", publishedReleaseId: generated.releaseId },
    });

    const publication = await requestJson(
      `/api/businesses/${firstBusinessId}/sites/${site.id}/publication/status`,
      { headers: { "x-user-id": firstOwnerId } },
    );
    assertCondition(publication.live === true, "Publication status did not become live");
    assertCondition(publication.liveUrl === `https://e2e-${suffix}.co.zw`, "Publication status returned the wrong live URL");

    const contact = await requestJson(`/api/public/sites/${site.id}/contact-submissions`, {
      method: "POST",
      headers: { "x-idempotency-key": `e2e-contact-${suffix}` },
      body: JSON.stringify({
        senderName: "E2E Visitor",
        senderEmail: "visitor@example.test",
        message: "Please contact me about your services.",
        consent: true,
      }),
    });
    const duplicateContact = await requestJson(`/api/public/sites/${site.id}/contact-submissions`, {
      method: "POST",
      headers: { "x-idempotency-key": `e2e-contact-${suffix}` },
      body: JSON.stringify({
        senderName: "E2E Visitor",
        senderEmail: "visitor@example.test",
        message: "Please contact me about your services.",
        consent: true,
      }),
    });
    assertCondition(contact.id === duplicateContact.id, "Duplicate contact submission was not deduplicated");

    const contactList = await requestJson(`/api/businesses/${firstBusinessId}/contact-submissions`, {
      headers: { "x-user-id": firstOwnerId },
    });
    assertCondition(contactList.some((item: { id: string }) => item.id === contact.id), "Contact enquiry was not tenant-visible");

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
    secondOwnerId = second.owner.id as string;

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
      publicationLive: publication.live,
      contactSubmissionId: contact.id,
      crossTenantStatus: crossTenant.status,
    }, null, 2));
  } finally {
    if (secondBusinessId) {
      await db.business.delete({ where: { id: secondBusinessId } });
    }
    if (firstBusinessId) {
      await db.business.delete({ where: { id: firstBusinessId } });
    }
    if (firstOwnerId) {
      await db.user.delete({ where: { id: firstOwnerId } }).catch(() => undefined);
    }
    if (secondOwnerId) {
      await db.user.delete({ where: { id: secondOwnerId } }).catch(() => undefined);
    }
    await db.$disconnect();
  }
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
