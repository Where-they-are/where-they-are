import { Injectable, NotFoundException } from "@nestjs/common";
import {
	createDeployment,
	getPublicationPrerequisites,
	requireBusinessRole,
	updateDeployment,
} from "@where-they-are/db";

const domainCustomerStatus = (status: string | undefined) => {
	switch (status) {
		case "REQUESTED":
			return "requested";
		case "PENDING_REGISTRATION":
			return "registration_in_progress";
		case "ACTIVE":
			return "registered";
		case "EXPIRED":
			return "renewal_due";
		case "SUSPENDED":
		case "CANCELLED":
			return "blocked";
		default:
			return "not_requested";
	}
};

@Injectable()
export class PublicationService {
	public async getStatus(businessId: string, siteId: string) {
		const state = await getPublicationPrerequisites(businessId, siteId);

		if (!state.site) {
			throw new NotFoundException("Site not found");
		}

		const isLive = Boolean(
			state.site.status === "PUBLISHED" &&
				state.approval &&
				state.payment &&
				state.domain?.status === "ACTIVE" &&
				state.deployment?.status === "SUCCEEDED"
		);

		const nextAction = isLive
			? "live"
			: state.approval
				? state.payment
					? !state.domain || state.domain.status !== "ACTIVE"
						? "domain_pending"
						: !state.deployment || state.deployment.status !== "SUCCEEDED"
							? "deployment_pending"
							: "publication_check_pending"
					: "payment_required"
				: "approval_required";

		return {
			approval: state.approval
				? {
						createdAt: state.approval.createdAt,
						releaseId: state.approval.releaseId,
						status: state.approval.status,
					}
				: null,
			deployment: state.deployment
				? {
						id: state.deployment.id,
						message: state.deployment.message,
						status: state.deployment.status,
						updatedAt: state.deployment.updatedAt,
					}
				: { status: "NOT_STARTED" },
			domain: state.domain
				? {
						customerStatus: domainCustomerStatus(state.domain.status),
						expiresAt: state.domain.expiresAt,
						hostname: state.domain.hostname,
						status: state.domain.status,
					}
				: { customerStatus: "not_requested", status: "NOT_REQUESTED" },
			live: isLive,
			liveUrl:
				isLive && state.domain ? `https://${state.domain.hostname}` : null,
			nextAction,
			payment: state.payment
				? {
						amount: state.payment.amount,
						currency: state.payment.currency,
						paidAt: state.payment.paidAt,
						status: state.payment.status,
					}
				: { status: "PENDING" },
			siteId,
			siteStatus: state.site.status,
		};
	}

	public async createDeployment(input: {
		businessId: string;
		siteId: string;
		releaseId: string;
		actorUserId: string;
		resourceUuid?: string;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return createDeployment({
			businessId: input.businessId,
			releaseId: input.releaseId,
			resourceUuid: input.resourceUuid,
			siteId: input.siteId,
		});
	}

	public async updateDeployment(input: {
		businessId: string;
		deploymentId: string;
		actorUserId: string;
		status:
			| "NOT_STARTED"
			| "QUEUED"
			| "IN_PROGRESS"
			| "SUCCEEDED"
			| "FAILED"
			| "BLOCKED";
		externalDeploymentId?: string;
		message?: string;
		startedAt?: Date | null;
		finishedAt?: Date | null;
	}) {
		await requireBusinessRole(input.businessId, input.actorUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		const result = await updateDeployment({
			businessId: input.businessId,
			deploymentId: input.deploymentId,
			externalDeploymentId: input.externalDeploymentId,
			finishedAt: input.finishedAt,
			message: input.message,
			startedAt: input.startedAt,
			status: input.status,
		});

		if (result.count === 0) {
			throw new NotFoundException("Deployment not found");
		}

		return { updated: true };
	}
}
