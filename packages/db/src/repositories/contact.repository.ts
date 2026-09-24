import { db } from "../client.js";

export type ContactSubmissionStatus = "NEW" | "READ" | "ARCHIVED" | "EXPIRED";

export const findPublicSiteForContact = (siteId: string) =>
	db.site.findFirst({
		select: { businessId: true, id: true },
		where: { id: siteId, status: "PUBLISHED" },
	});

export const createContactSubmission = async (input: {
	businessId: string;
	siteId: string;
	dedupeKey?: string;
	senderName: string;
	senderEmail?: string;
	senderPhone?: string;
	message: string;
	retentionUntil: Date;
}) => {
	if (input.dedupeKey) {
		const existing = await db.contactSubmission.findUnique({
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

	return db.contactSubmission.create({
		data: input,
	});
};

export const listContactSubmissionsForBusiness = async (businessId: string) =>
	db.contactSubmission.findMany({
		include: { site: true },
		orderBy: { createdAt: "desc" },
		where: { businessId },
	});

export const findContactSubmissionForBusiness = async (
	businessId: string,
	submissionId: string
) =>
	db.contactSubmission.findFirst({
		include: { site: true },
		where: { businessId, id: submissionId },
	});

export const markContactSubmissionRead = async (
	businessId: string,
	submissionId: string
) =>
	db.contactSubmission.updateMany({
		data: { readAt: new Date(), status: "READ" },
		where: { businessId, id: submissionId, status: "NEW" },
	});

export const setContactSubmissionStarred = async (input: {
	businessId: string;
	submissionId: string;
	starred: boolean;
}) =>
	db.contactSubmission.updateMany({
		data: {
			starred: input.starred,
			starredAt: input.starred ? new Date() : null,
		},
		where: { businessId: input.businessId, id: input.submissionId },
	});

export const updateContactSubmissionStatus = async (input: {
	businessId: string;
	submissionId: string;
	status: ContactSubmissionStatus;
}) =>
	db.contactSubmission.updateMany({
		data: {
			archivedAt: input.status === "ARCHIVED" ? new Date() : null,
			status: input.status,
		},
		where: { businessId: input.businessId, id: input.submissionId },
	});

export const expireUnstarredContactSubmissions = (now = new Date()) =>
	db.contactSubmission.updateMany({
		data: { status: "EXPIRED" },
		where: {
			retentionUntil: { lt: now },
			starred: false,
			status: { not: "EXPIRED" },
		},
	});
