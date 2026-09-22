import type { Prisma } from "../generated/prisma/client.js";

import { db } from "../client.js";

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
      slug: input.slug,
      plan: input.plan ?? "STARTER",
      template: input.template ?? "SERVICE_PRO",
    },
  });

export const findSiteForBusiness = async (businessId: string, siteId: string) =>
  db.site.findFirst({
    where: { id: siteId, businessId },
    include: { releases: { orderBy: { version: "desc" } } },
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
      siteId: input.siteId,
      plan: input.plan ?? "STARTER",
      intakeMessageIds: input.intakeMessageIds,
      request: input.request,
    },
  });

export const createSiteRelease = async (input: {
  businessId: string;
  siteId: string;
  previewSlug: string;
  specification: Prisma.InputJsonValue;
  artifactPath?: string;
  artifactChecksum?: string;
}) =>
  db.$transaction(async (transaction) => {
    const site = await transaction.site.findFirst({
      where: { id: input.siteId, businessId: input.businessId },
      select: { id: true },
    });

    if (!site) {
      throw new Error("Site does not belong to business");
    }

    const latest = await transaction.siteRelease.findFirst({
      where: { siteId: input.siteId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const release = await transaction.siteRelease.create({
      data: {
        siteId: input.siteId,
        version: (latest?.version ?? 0) + 1,
        previewSlug: input.previewSlug,
        specification: input.specification,
        artifactPath: input.artifactPath,
        artifactChecksum: input.artifactChecksum,
      },
    });

    await transaction.site.update({
      where: { id: input.siteId },
      data: { status: "PREVIEW", previewSlug: input.previewSlug },
    });

    return release;
  });

export const findReleaseForBusiness = async (businessId: string, releaseId: string) =>
  db.siteRelease.findFirst({
    where: {
      id: releaseId,
      site: { businessId },
    },
    include: { site: true },
  });
