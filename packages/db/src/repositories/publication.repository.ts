import { db } from "../client.js";

export type DeploymentStatus =
	| "NOT_STARTED"
	| "QUEUED"
	| "IN_PROGRESS"
	| "SUCCEEDED"
	| "FAILED"
	| "BLOCKED";

export const createDeployment = async (input: {
	businessId: string;
	siteId: string;
	releaseId: string;
	resourceUuid?: string;
	status?: DeploymentStatus;
	message?: string;
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

	return db.deployment.create({ data: input });
};

export const findLatestDeploymentForSite = (
	businessId: string,
	siteId: string
) =>
	db.deployment.findFirst({
		include: { release: true },
		orderBy: { createdAt: "desc" },
		where: { businessId, siteId },
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
		data: {
			externalDeploymentId: input.externalDeploymentId,
			finishedAt: input.finishedAt,
			message: input.message,
			startedAt: input.startedAt,
			status: input.status,
		},
		where: { businessId: input.businessId, id: input.deploymentId },
	});

export const getPublicationPrerequisites = async (
	businessId: string,
	siteId: string
) => {
	const [site, approval, payment, domain, deployment] = await Promise.all([
		db.site.findFirst({
			include: { publishedRelease: true },
			where: { businessId, id: siteId },
		}),
		db.siteApproval.findFirst({
			include: { release: true },
			orderBy: { createdAt: "desc" },
			where: { businessId, siteId, status: "APPROVED" },
		}),
		db.payment.findFirst({
			orderBy: { paidAt: "desc" },
			where: { businessId, siteId, status: "PAID" },
		}),
		db.domain.findFirst({
			orderBy: { createdAt: "desc" },
			where: { businessId, siteId },
		}),
		findLatestDeploymentForSite(businessId, siteId),
	]);

	return { approval, deployment, domain, payment, site };
};
