import { db } from "../client.js";

export type ContactSubmissionStatus = "NEW" | "READ" | "ARCHIVED" | "EXPIRED";

export const findPublicSiteForContact = (siteId: string) =>
  db.site.findFirst({
    where: { id: siteId, status: "PUBLISHED" },
    select: { id: true, businessId: true },
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
      where: { businessId_dedupeKey: { businessId: input.businessId, dedupeKey: input.dedupeKey } },
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
    where: { businessId },
    include: { site: true },
    orderBy: { createdAt: "desc" },
  });

export const findContactSubmissionForBusiness = async (businessId: string, submissionId: string) =>
  db.contactSubmission.findFirst({
    where: { id: submissionId, businessId },
    include: { site: true },
  });

export const markContactSubmissionRead = async (businessId: string, submissionId: string) =>
  db.contactSubmission.updateMany({
    where: { id: submissionId, businessId, status: "NEW" },
    data: { status: "READ", readAt: new Date() },
  });

export const setContactSubmissionStarred = async (input: {
  businessId: string;
  submissionId: string;
  starred: boolean;
}) =>
  db.contactSubmission.updateMany({
    where: { id: input.submissionId, businessId: input.businessId },
    data: { starred: input.starred, starredAt: input.starred ? new Date() : null },
  });

export const updateContactSubmissionStatus = async (input: {
  businessId: string;
  submissionId: string;
  status: ContactSubmissionStatus;
}) =>
  db.contactSubmission.updateMany({
    where: { id: input.submissionId, businessId: input.businessId },
    data: { status: input.status, archivedAt: input.status === "ARCHIVED" ? new Date() : null },
  });

export const expireUnstarredContactSubmissions = (now = new Date()) =>
  db.contactSubmission.updateMany({
    where: { retentionUntil: { lt: now }, starred: false, status: { not: "EXPIRED" } },
    data: { status: "EXPIRED" },
  });
