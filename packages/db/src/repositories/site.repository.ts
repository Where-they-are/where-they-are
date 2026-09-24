import { db } from "../client.js";
import type { Prisma } from "../generated/prisma/client.js";

export const createSite = async (input: {
	businessId: string;
	name: string;
	slug: string;
	plan?: "STARTER" | "GROWTH" | "PREMIUM";
	template?: "SERVICE_PRO" | "HOSPITALITY" | "EVENTS_COMMUNITY";
}) =>
	db.site.create({
		data: {
			businessId: input.businessId,
			name: input.name,
			plan: input.plan ?? "STARTER",
			slug: input.slug,
			template: input.template ?? "SERVICE_PRO",
		},
	});

export const findSiteForBusiness = async (businessId: string, siteId: string) =>
	db.site.findFirst({
		include: { releases: { orderBy: { version: "desc" } } },
		where: { businessId, id: siteId },
	});

export const listSitesForBusiness = async (businessId: string) =>
	db.site.findMany({
		include: { releases: { orderBy: { version: "desc" }, take: 5 } },
		orderBy: { updatedAt: "desc" },
		where: { businessId },
	});

export const createGenerationJob = async (input: {
	businessId: string;
	siteId?: string;
	plan?: "STARTER" | "GROWTH" | "PREMIUM";
	intakeMessageIds: string[];
	request: Prisma.InputJsonValue;
}) =>
	db.generationJob.create({
		data: {
			businessId: input.businessId,
			intakeMessageIds: input.intakeMessageIds,
			plan: input.plan ?? "STARTER",
			request: input.request,
			siteId: input.siteId,
		},
	});

export const createSiteRelease = async (input: {
	businessId: string;
	siteId: string;
	releaseId?: string;
	previewSlug: string;
	specification: Prisma.InputJsonValue;
	artifactPath?: string;
	artifactChecksum?: string;
}) =>
	db.$transaction(async (transaction: Prisma.TransactionClient) => {
		const site = await transaction.site.findFirst({
			select: { id: true },
			where: { businessId: input.businessId, id: input.siteId },
		});

		if (!site) {
			throw new Error("Site does not belong to business");
		}

		const latest = await transaction.siteRelease.findFirst({
			orderBy: { version: "desc" },
			select: { version: true },
			where: { siteId: input.siteId },
		});

		const release = await transaction.siteRelease.create({
			data: {
				artifactChecksum: input.artifactChecksum,
				artifactPath: input.artifactPath,
				id: input.releaseId,
				previewSlug: input.previewSlug,
				siteId: input.siteId,
				specification: input.specification,
				version: (latest?.version ?? 0) + 1,
			},
		});

		await transaction.site.update({
			data: { previewSlug: input.previewSlug, status: "PREVIEW" },
			where: { id: input.siteId },
		});

		return release;
	});

export const findReleaseForBusiness = async (
	businessId: string,
	releaseId: string
) =>
	db.siteRelease.findFirst({
		include: { site: true },
		where: {
			id: releaseId,
			site: { businessId },
		},
	});
