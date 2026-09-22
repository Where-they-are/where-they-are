import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createBusinessWithOwner,
  createContactSubmission,
  createDeployment,
  createDomain,
  createInvoice,
  createPayment,
  createSite,
  createSiteApproval,
  createSiteFeedback,
  createSiteRelease,
  createSubscription,
  db,
  expireUnstarredContactSubmissions,
  getPublicationPrerequisites,
  listContactSubmissionsForBusiness,
  updateDeployment,
  updateDomainStatus,
  updateInvoiceStatus,
  updatePaymentStatus,
  updateSubscriptionStatus,
} from "@where-they-are/db";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const databaseEnabled = Boolean(process.env.DATABASE_URL);
let businessId = "";
let siteId = "";
let releaseId = "";

const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);


describe.runIf(databaseEnabled)("lean feature 13–18 repositories", () => {
  beforeAll(async () => {
    const ownerResult = await createBusinessWithOwner({
      ownerEmail: `lean-owner-${suffix}@example.test`,
      ownerDisplayName: "Lean Feature Owner",
      businessName: `Lean Feature Business ${suffix}`,
      businessSlug: `lean-feature-${suffix}`,
      category: "restaurant",
      location: "Harare",
    });

    businessId = ownerResult.business.id;

    const site = await createSite({
      businessId,
      name: "Lean Feature Site",
      slug: `lean-site-${suffix}`,
    });
    siteId = site.id;

    const release = await createSiteRelease({
      businessId,
      siteId,
      previewSlug: `lean-preview-${suffix}`,
      specification: { businessName: "Lean Feature Business", sections: [] },
    });
    releaseId = release.id;
  });

  afterAll(async () => {
    if (businessId) {
      await db.business.delete({ where: { id: businessId } });
    }
    await db.$disconnect();
  });

  it("keeps payment, domain, and billing records tenant-scoped", async () => {
    const payment = await createPayment({
      businessId,
      siteId,
      provider: "MANUAL",
      amount: "150.00",
      purpose: "WEBSITE",
      description: "Website fee",
    });

    const paidPayment = await updatePaymentStatus({
      businessId,
      paymentId: payment.id,
      status: "PAID",
      paidAt: new Date(),
    });

    expect(paidPayment.status).toBe("PAID");

    const domain = await createDomain({
      businessId,
      siteId,
      hostname: `lean-${suffix}.co.zw`,
      kind: "CO_ZW",
    });
    const activeDomain = await updateDomainStatus({
      businessId,
      domainId: domain.id,
      status: "ACTIVE",
      verifiedAt: new Date(),
      expiresAt: futureDate(365),
    });
    expect(activeDomain.status).toBe("ACTIVE");

    const subscription = await createSubscription({
      businessId,
      siteId,
      plan: "GROWTH",
      amount: "10.00",
      currentPeriodEnd: futureDate(30),
    });
    const invoice = await createInvoice({
      businessId,
      subscriptionId: subscription.id,
      number: `TEST-INV-${suffix}`,
      amount: "10.00",
      description: "Hosting renewal",
    });
    const paidInvoice = await updateInvoiceStatus({
      businessId,
      invoiceId: invoice.id,
      status: "PAID",
      paidAt: new Date(),
    });

    expect(paidInvoice.status).toBe("PAID");
    await expect(updateSubscriptionStatus({
      businessId: "different-business",
      subscriptionId: subscription.id,
      status: "CANCELLED",
    })).rejects.toThrow();
  });

  it("deduplicates public enquiries and preserves starred records past retention", async () => {
    const first = await createContactSubmission({
      businessId,
      siteId,
      dedupeKey: `contact-${suffix}`,
      senderName: "Public Visitor",
      senderEmail: "visitor@example.test",
      message: "I would like to know more.",
      retentionUntil: new Date(Date.now() - 1000),
    });
    const duplicate = await createContactSubmission({
      businessId,
      siteId,
      dedupeKey: `contact-${suffix}`,
      senderName: "Public Visitor",
      senderEmail: "visitor@example.test",
      message: "I would like to know more.",
      retentionUntil: futureDate(30),
    });

    expect(duplicate.id).toBe(first.id);
    await db.contactSubmission.update({ where: { id: first.id }, data: { starred: true } });
    await expireUnstarredContactSubmissions();

    const records = await listContactSubmissionsForBusiness(businessId);
    expect(records.find((record) => record.id === first.id)?.status).not.toBe("EXPIRED");
  });

  it("requires the exact preview release for approval and publication prerequisites", async () => {
    const feedback = await createSiteFeedback({
      businessId,
      siteId,
      releaseId,
      type: "FACTUAL_CORRECTION",
      description: "Correct the opening-hours wording.",
      dedupeKey: `feedback-${suffix}`,
    });
    expect(feedback.status).toBe("SUBMITTED");

    const approval = await createSiteApproval({
      businessId,
      siteId,
      releaseId,
      approvedBy: "owner-test-user",
    });
    expect(approval.status).toBe("APPROVED");

    const deployment = await createDeployment({ businessId, siteId, releaseId });
    await updateDeployment({
      businessId,
      deploymentId: deployment.id,
      status: "SUCCEEDED",
      finishedAt: new Date(),
    });

    await db.site.update({
      where: { id: siteId },
      data: { status: "PUBLISHED", publishedReleaseId: releaseId },
    });

    const prerequisites = await getPublicationPrerequisites(businessId, siteId);
    expect(prerequisites.approval?.releaseId).toBe(releaseId);
    expect(prerequisites.deployment?.status).toBe("SUCCEEDED");
    expect(prerequisites.site?.publishedReleaseId).toBe(releaseId);
  });
});
