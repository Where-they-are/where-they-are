import { db } from "../client.js";

export type FeedbackType =
	| "FACTUAL_CORRECTION"
	| "CONTENT_ADDITION"
	| "DESIGN_PREFERENCE";
export type FeedbackStatus =
	| "SUBMITTED"
	| "IN_REVIEW"
	| "RESOLVED"
	| "CANCELLED";

export const createSiteFeedback = async (input: {
	businessId: string;
	siteId: string;
	releaseId: string;
	type: FeedbackType;
	description: string;
	dedupeKey?: string;
}) => {
	const release = await db.siteRelease.findFirst({
		select: { id: true },
		where: {
			id: input.releaseId,
			site: { businessId: input.businessId },
			siteId: input.siteId,
		},
	});

	if (!release) {
		throw new Error("Release does not belong to site and business");
	}

	if (input.dedupeKey) {
		const existing = await db.siteFeedback.findUnique({
			where: {
				businessId_dedupeKey: {
					businessId: input.businessId,
					dedupeKey: input.dedupeKey,
				},
			},
		});

		if (existing) {
			return existing;
		}
	}

	return db.siteFeedback.create({ data: input });
};

export const listSiteFeedback = (businessId: string, siteId: string) =>
	db.siteFeedback.findMany({
		include: { release: true },
		orderBy: { createdAt: "desc" },
		where: { businessId, siteId },
	});

export const createSiteApproval = async (input: {
	businessId: string;
	siteId: string;
	releaseId: string;
	approvedBy: string;
}) => {
	const release = await db.siteRelease.findFirst({
		select: { id: true, status: true },
		where: {
			id: input.releaseId,
			site: { businessId: input.businessId },
			siteId: input.siteId,
		},
	});

	if (!release) {
		throw new Error("Release does not belong to site and business");
	}

	if (release.status !== "PREVIEW") {
		throw new Error("Only a preview release can be approved");
	}

	return db.siteApproval.upsert({
		create: input,
		update: {
			approvedBy: input.approvedBy,
			revokedAt: null,
			status: "APPROVED",
		},
		where: {
			businessId_releaseId: {
				businessId: input.businessId,
				releaseId: input.releaseId,
			},
		},
	});
};

export const findSiteApproval = (
	businessId: string,
	siteId: string,
	releaseId: string
) =>
	db.siteApproval.findFirst({
		include: { release: true },
		where: { businessId, releaseId, siteId },
	});
