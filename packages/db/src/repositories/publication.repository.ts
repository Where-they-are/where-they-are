import { db } from "../client.js";

export type DeploymentStatus = "NOT_STARTED" | "QUEUED" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "BLOCKED";

export const createDeployment = async (input: {
  businessId: string;
  siteId: string;
  releaseId: string;
  resourceUuid?: string;
  status?: DeploymentStatus;
  message?: string;
}) => {
  const release = await db.siteRelease.findFirst({
    where: { id: input.releaseId, siteId: input.siteId, site: { businessId: input.businessId } },
    select: { id: true },
  });

  if (!release) {
    throw new Error("Release does not belong to site and business");
  }

  return db.deployment.create({ data: input });
};

export const findLatestDeploymentForSite = (businessId: string, siteId: string) =>
  db.deployment.findFirst({
    where: { businessId, siteId },
    orderBy: { createdAt: "desc" },
    include: { release: true },
  });

export const updateDeployment = async (input: {
  businessId: string;
  deploymentId: string;
  status: DeploymentStatus;
  externalDeploymentId?: string;
  message?: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}) =>
  db.deployment.updateMany({
    where: { id: input.deploymentId, businessId: input.businessId },
    data: {
      status: input.status,
      externalDeploymentId: input.externalDeploymentId,
      message: input.message,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
    },
  });

export const getPublicationPrerequisites = async (businessId: string, siteId: string) => {
  const [site, approval, payment, domain, deployment] = await Promise.all([
    db.site.findFirst({ where: { id: siteId, businessId }, include: { publishedRelease: true } }),
    db.siteApproval.findFirst({ where: { businessId, siteId, status: "APPROVED" }, orderBy: { createdAt: "desc" }, include: { release: true } }),
    db.payment.findFirst({ where: { businessId, siteId, status: "PAID" }, orderBy: { paidAt: "desc" } }),
    db.domain.findFirst({ where: { businessId, siteId }, orderBy: { createdAt: "desc" } }),
    findLatestDeploymentForSite(businessId, siteId),
  ]);

  return { site, approval, payment, domain, deployment };
};
