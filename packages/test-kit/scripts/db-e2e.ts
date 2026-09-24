import { db, findReleaseForBusiness } from "@where-they-are/db";

type JsonResponse = Record<string, any>;

const serverBaseUrl = process.env.SERVER_BASE_URL ?? "http://localhost:3100";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const requestJson = async (
	path: string,
	init: RequestInit = {}
): Promise<JsonResponse> => {
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
		throw new Error(
			`${init.method ?? "GET"} ${path} failed with ${response.status}: ${body}`
		);
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
			body: JSON.stringify({
				businessName: `E2E Business ${suffix}`,
				businessSlug: `e2e-business-${suffix}`,
				category: "barber",
				displayName: "E2E Owner",
				email: `e2e-owner-${suffix}@example.test`,
				location: "Harare",
			}),
			method: "POST",
		});
		firstBusinessId = first.business.id as string;
		firstOwnerId = first.owner.id as string;

		const membership = await requestJson(
			`/api/auth/businesses/${firstBusinessId}/membership`,
			{ headers: { "x-user-id": firstOwnerId } }
		);
		assertCondition(
			membership.id === firstBusinessId,
			"Owner membership lookup returned the wrong business"
		);
		assertCondition(
			membership.memberships?.some(
				(member: { userId: string; role: string; status: string }) =>
					member.userId === firstOwnerId &&
					member.role === "OWNER" &&
					member.status === "ACTIVE"
			) === true,
			"Owner membership was not active with OWNER role"
		);

		const business = await requestJson(`/api/businesses/${firstBusinessId}`, {
			headers: { "x-user-id": firstOwnerId },
		});
		assertCondition(
			business.id === firstBusinessId,
			"Business lookup returned the wrong tenant"
		);

		const unauthorized = await fetch(
			`${serverBaseUrl}/api/businesses/${firstBusinessId}`
		);
		assertCondition(
			unauthorized.status === 401,
			`Expected missing tenant identity to return 401, got ${unauthorized.status}`
		);

		const site = await requestJson(`/api/businesses/${firstBusinessId}/sites`, {
			body: JSON.stringify({
				name: "E2E Brochure Site",
				plan: "STARTER",
				slug: `e2e-site-${suffix}`,
				template: "SERVICE_PRO",
			}),
			headers: { "x-user-id": firstOwnerId },
			method: "POST",
		});

		assertCondition(
			site.businessId === firstBusinessId,
			"Created site is not owned by the first business"
		);
		assertCondition(
			site.status === "DRAFT",
			`New site should be DRAFT, got ${site.status}`
		);

		const sites = await requestJson(
			`/api/businesses/${firstBusinessId}/sites`,
			{
				headers: { "x-user-id": firstOwnerId },
			}
		);
		assertCondition(
			Array.isArray(sites) &&
				sites.some((candidate: { id: string }) => candidate.id === site.id),
			"Created site was not returned by the tenant site list"
		);

		const siteDetail = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}`,
			{
				headers: { "x-user-id": firstOwnerId },
			}
		);
		assertCondition(
			siteDetail.id === site.id,
			"Site detail lookup returned the wrong site"
		);

		const generated = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}/generate`,
			{
				body: JSON.stringify({
					intake: {
						assetNotes: [],
						businessCategory: "barber",
						businessName: `E2E Business ${suffix}`,
						description: "A test business for release persistence.",
						factualClaims: ["Serving Harare"],
						intent: "new_lead",
						location: "Harare",
						missingFields: [],
						operatingHours: null,
						phone: "+263771234567",
						services: ["Haircuts"],
						suggestedReply: "Your preview is ready.",
						whatsapp: "+263771234567",
					},
					intakeMessageIds: [`e2e-message-${suffix}`],
					plan: "starter",
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);

		assertCondition(
			typeof generated.releaseId === "string",
			"Generation response is missing releaseId"
		);
		assertCondition(
			typeof generated.previewSlug === "string",
			"Generation response is missing previewSlug"
		);
		assertCondition(
			typeof generated.previewUrl === "string",
			"Generation response is missing previewUrl"
		);
		assertCondition(
			generated.specification?.businessName === `E2E Business ${suffix}`,
			"Generated specification has the wrong business name"
		);

		const updatedSite = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}`,
			{
				headers: { "x-user-id": firstOwnerId },
			}
		);
		assertCondition(
			updatedSite.status === "PREVIEW",
			`Generated site should be PREVIEW, got ${updatedSite.status}`
		);
		assertCondition(
			updatedSite.previewSlug === generated.previewSlug,
			"Site preview slug was not persisted"
		);

		const release = await findReleaseForBusiness(
			firstBusinessId,
			generated.releaseId as string
		);
		if (!release) {
			throw new Error(
				"Generated release metadata was not persisted for the owning business"
			);
		}
		if (release.siteId !== site.id) {
			throw new Error("Generated release is attached to the wrong site");
		}

		const preview = await fetch(
			`${serverBaseUrl}/api/previews/${generated.previewSlug}`
		);
		const previewHtml = await preview.text();
		if (!(preview.ok && previewHtml.includes(`E2E Business ${suffix}`))) {
			throw new Error(
				"Persisted release preview was not retrievable through the API"
			);
		}

		const payment = await requestJson(
			`/api/businesses/${firstBusinessId}/payments`,
			{
				body: JSON.stringify({
					amount: "50.00",
					description: "E2E website payment",
					provider: "MANUAL",
					purpose: "WEBSITE",
					siteId: site.id,
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		await requestJson(
			`/api/businesses/${firstBusinessId}/payments/${payment.id}/status`,
			{
				body: JSON.stringify({
					paidAt: new Date().toISOString(),
					status: "PAID",
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);

		const domain = await requestJson(
			`/api/businesses/${firstBusinessId}/domains`,
			{
				body: JSON.stringify({
					hostname: `e2e-${suffix}.co.zw`,
					kind: "CO_ZW",
					siteId: site.id,
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		await requestJson(
			`/api/businesses/${firstBusinessId}/domains/${domain.id}/status`,
			{
				body: JSON.stringify({
					status: "ACTIVE",
					verifiedAt: new Date().toISOString(),
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);

		const subscription = await requestJson(
			`/api/businesses/${firstBusinessId}/billing/subscriptions`,
			{
				body: JSON.stringify({
					amount: "5.00",
					currentPeriodEnd: new Date(
						Date.now() + 30 * 24 * 60 * 60 * 1000
					).toISOString(),
					plan: "STARTER",
					siteId: site.id,
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		const invoice = await requestJson(
			`/api/businesses/${firstBusinessId}/billing/invoices`,
			{
				body: JSON.stringify({
					amount: "5.00",
					description: "E2E hosting renewal",
					subscriptionId: subscription.id,
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		await requestJson(
			`/api/businesses/${firstBusinessId}/billing/invoices/${invoice.id}/status`,
			{
				body: JSON.stringify({
					paidAt: new Date().toISOString(),
					status: "PAID",
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);

		const feedback = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}/feedback`,
			{
				body: JSON.stringify({
					dedupeKey: `e2e-feedback-${suffix}`,
					description: "Correct the E2E opening-hours wording.",
					releaseId: generated.releaseId,
					type: "FACTUAL_CORRECTION",
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		assertCondition(
			feedback.status === "SUBMITTED",
			"Feedback was not submitted"
		);

		const approval = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}/approve`,
			{
				body: JSON.stringify({ releaseId: generated.releaseId }),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		assertCondition(
			approval.status === "APPROVED",
			"Release approval was not recorded"
		);

		const deployment = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}/publication/deployments`,
			{
				body: JSON.stringify({ releaseId: generated.releaseId }),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}/publication/deployments/${deployment.id}/status`,
			{
				body: JSON.stringify({
					finishedAt: new Date().toISOString(),
					status: "SUCCEEDED",
				}),
				headers: { "x-user-id": firstOwnerId },
				method: "POST",
			}
		);
		await db.site.update({
			data: { publishedReleaseId: generated.releaseId, status: "PUBLISHED" },
			where: { id: site.id },
		});

		const publication = await requestJson(
			`/api/businesses/${firstBusinessId}/sites/${site.id}/publication/status`,
			{ headers: { "x-user-id": firstOwnerId } }
		);
		assertCondition(
			publication.live === true,
			"Publication status did not become live"
		);
		assertCondition(
			publication.liveUrl === `https://e2e-${suffix}.co.zw`,
			"Publication status returned the wrong live URL"
		);

		const contact = await requestJson(
			`/api/public/sites/${site.id}/contact-submissions`,
			{
				body: JSON.stringify({
					consent: true,
					message: "Please contact me about your services.",
					senderEmail: "visitor@example.test",
					senderName: "E2E Visitor",
				}),
				headers: { "x-idempotency-key": `e2e-contact-${suffix}` },
				method: "POST",
			}
		);
		const duplicateContact = await requestJson(
			`/api/public/sites/${site.id}/contact-submissions`,
			{
				body: JSON.stringify({
					consent: true,
					message: "Please contact me about your services.",
					senderEmail: "visitor@example.test",
					senderName: "E2E Visitor",
				}),
				headers: { "x-idempotency-key": `e2e-contact-${suffix}` },
				method: "POST",
			}
		);
		assertCondition(
			contact.id === duplicateContact.id,
			"Duplicate contact submission was not deduplicated"
		);

		const contactList = await requestJson(
			`/api/businesses/${firstBusinessId}/contact-submissions`,
			{
				headers: { "x-user-id": firstOwnerId },
			}
		);
		assertCondition(
			contactList.some((item: { id: string }) => item.id === contact.id),
			"Contact enquiry was not tenant-visible"
		);

		const second = await requestJson("/api/auth/bootstrap", {
			body: JSON.stringify({
				businessName: `Other Business ${suffix}`,
				businessSlug: `other-business-${suffix}`,
				displayName: "Other Owner",
				email: `e2e-other-${suffix}@example.test`,
			}),
			method: "POST",
		});
		secondBusinessId = second.business.id as string;
		secondOwnerId = second.owner.id as string;

		const crossTenant = await fetch(
			`${serverBaseUrl}/api/businesses/${firstBusinessId}/sites`,
			{
				headers: { "x-user-id": secondOwnerId },
			}
		);
		if (crossTenant.status !== 403) {
			throw new Error(
				`Expected cross-tenant access to return 403, got ${crossTenant.status}`
			);
		}

		console.info(
			JSON.stringify(
				{
					businessId: firstBusinessId,
					contactSubmissionId: contact.id,
					crossTenantStatus: crossTenant.status,
					previewSlug: generated.previewSlug,
					publicationLive: publication.live,
					releaseId: generated.releaseId,
					siteId: site.id,
					status: "passed",
				},
				null,
				2
			)
		);
	} finally {
		if (secondBusinessId) {
			await db.business.delete({ where: { id: secondBusinessId } });
		}
		if (firstBusinessId) {
			await db.business.delete({ where: { id: firstBusinessId } });
		}
		if (firstOwnerId) {
			await db.user
				.delete({ where: { id: firstOwnerId } })
				.catch(() => undefined);
		}
		if (secondOwnerId) {
			await db.user
				.delete({ where: { id: secondOwnerId } })
				.catch(() => undefined);
		}
		await db.$disconnect();
	}
};

void run().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
