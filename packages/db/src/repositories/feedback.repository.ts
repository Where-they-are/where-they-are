import { db } from "../client.js";

export type FeedbackType = "FACTUAL_CORRECTION" | "CONTENT_ADDITION" | "DESIGN_PREFERENCE";
export type FeedbackStatus = "SUBMITTED" | "IN_REVIEW" | "RESOLVED" | "CANCELLED";

export const createSiteFeedback = async (input: {
  businessId: string;
  siteId: string;
  releaseId: string;
  type: FeedbackType;
  description: string;
  dedupeKey?: string;
}) => {
  const release = await db.siteRelease.findFirst({
    where: { id: input.releaseId, siteId: input.siteId, site: { businessId: input.businessId } },
    select: { id: true },
  });

  if (!release) {
    throw new Error("Release does not belong to site and business");
  }

  if (input.dedupeKey) {
    const existing = await db.siteFeedback.findUnique({
      where: { businessId_dedupeKey: { businessId: input.businessId, dedupeKey: input.dedupeKey } },
    });

    if (existing) {
      return existing;
    }
  }

  return db.siteFeedback.create({ data: input });
};

export const listSiteFeedback = (businessId: string, siteId: string) =>
  db.siteFeedback.findMany({
    where: { businessId, siteId },
    include: { release: true },
    orderBy: { createdAt: "desc" },
  });

export const createSiteApproval = async (input: {
  businessId: string;
  siteId: string;
  releaseId: string;
  approvedBy: string;
}) => {
  const release = await db.siteRelease.findFirst({
    where: { id: input.releaseId, siteId: input.siteId, site: { businessId: input.businessId } },
    select: { id: true, status: true },
  });

  if (!release) {
    throw new Error("Release does not belong to site and business");
  }

  if (release.status !== "PREVIEW") {
    throw new Error("Only a preview release can be approved");
  }

  return db.siteApproval.upsert({
    where: { businessId_releaseId: { businessId: input.businessId, releaseId: input.releaseId } },
    create: input,
    update: { approvedBy: input.approvedBy, status: "APPROVED", revokedAt: null },
  });
};

export const findSiteApproval = (businessId: string, siteId: string, releaseId: string) =>
  db.siteApproval.findFirst({
    where: { businessId, siteId, releaseId },
    include: { release: true },
  });
