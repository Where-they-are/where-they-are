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
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const databaseEnabled = Boolean(process.env.DATABASE_URL);
let businessId = "";
let siteId = "";
let releaseId = "";

const futureDate = (days: number) =>
	new Date(Date.now() + days * 24 * 60 * 60 * 1000);

describe.runIf(databaseEnabled)("lean feature 13–18 repositories", () => {
	beforeAll(async () => {
		const ownerResult = await createBusinessWithOwner({
			businessName: `Lean Feature Business ${suffix}`,
			businessSlug: `lean-feature-${suffix}`,
			category: "restaurant",
			location: "Harare",
			ownerDisplayName: "Lean Feature Owner",
			ownerEmail: `lean-owner-${suffix}@example.test`,
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
			previewSlug: `lean-preview-${suffix}`,
			siteId,
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
			amount: "150.00",
			businessId,
			description: "Website fee",
			provider: "MANUAL",
			purpose: "WEBSITE",
			siteId,
		});

		const paidPayment = await updatePaymentStatus({
			businessId,
			paidAt: new Date(),
			paymentId: payment.id,
			status: "PAID",
		});

		expect(paidPayment.status).toBe("PAID");

		const domain = await createDomain({
			businessId,
			hostname: `lean-${suffix}.co.zw`,
			kind: "CO_ZW",
			siteId,
		});
		const activeDomain = await updateDomainStatus({
			businessId,
			domainId: domain.id,
			expiresAt: futureDate(365),
			status: "ACTIVE",
			verifiedAt: new Date(),
		});
		expect(activeDomain.status).toBe("ACTIVE");

		const subscription = await createSubscription({
			amount: "10.00",
			businessId,
			currentPeriodEnd: futureDate(30),
			plan: "GROWTH",
			siteId,
		});
		const invoice = await createInvoice({
			amount: "10.00",
			businessId,
			description: "Hosting renewal",
			number: `TEST-INV-${suffix}`,
			subscriptionId: subscription.id,
		});
		const paidInvoice = await updateInvoiceStatus({
			businessId,
			invoiceId: invoice.id,
			paidAt: new Date(),
			status: "PAID",
		});

		expect(paidInvoice.status).toBe("PAID");
		await expect(
			updateSubscriptionStatus({
				businessId: "different-business",
				status: "CANCELLED",
				subscriptionId: subscription.id,
			})
		).rejects.toThrow();
	});

	it("deduplicates public enquiries and preserves starred records past retention", async () => {
		const first = await createContactSubmission({
			businessId,
			dedupeKey: `contact-${suffix}`,
			message: "I would like to know more.",
			retentionUntil: new Date(Date.now() - 1000),
			senderEmail: "visitor@example.test",
			senderName: "Public Visitor",
			siteId,
		});
		const duplicate = await createContactSubmission({
			businessId,
			dedupeKey: `contact-${suffix}`,
			message: "I would like to know more.",
			retentionUntil: futureDate(30),
			senderEmail: "visitor@example.test",
			senderName: "Public Visitor",
			siteId,
		});

		expect(duplicate.id).toBe(first.id);
		await db.contactSubmission.update({
			data: { starred: true },
			where: { id: first.id },
		});
		await expireUnstarredContactSubmissions();

		const records = await listContactSubmissionsForBusiness(businessId);
		expect(records.find((record) => record.id === first.id)?.status).not.toBe(
			"EXPIRED"
		);
	});

	it("requires the exact preview release for approval and publication prerequisites", async () => {
		const feedback = await createSiteFeedback({
			businessId,
			dedupeKey: `feedback-${suffix}`,
			description: "Correct the opening-hours wording.",
			releaseId,
			siteId,
			type: "FACTUAL_CORRECTION",
		});
		expect(feedback.status).toBe("SUBMITTED");

		const approval = await createSiteApproval({
			approvedBy: "owner-test-user",
			businessId,
			releaseId,
			siteId,
		});
		expect(approval.status).toBe("APPROVED");

		const deployment = await createDeployment({
			businessId,
			releaseId,
			siteId,
		});
		await updateDeployment({
			businessId,
			deploymentId: deployment.id,
			finishedAt: new Date(),
			status: "SUCCEEDED",
		});

		await db.site.update({
			data: { publishedReleaseId: releaseId, status: "PUBLISHED" },
			where: { id: siteId },
		});

		const prerequisites = await getPublicationPrerequisites(businessId, siteId);
		expect(prerequisites.approval?.releaseId).toBe(releaseId);
		expect(prerequisites.deployment?.status).toBe("SUCCEEDED");
		expect(prerequisites.site?.publishedReleaseId).toBe(releaseId);
	});
});
