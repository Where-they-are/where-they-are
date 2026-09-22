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
        state.deployment?.status === "SUCCEEDED",
    );

    const nextAction = isLive
      ? "live"
      : !state.approval
        ? "approval_required"
        : !state.payment
          ? "payment_required"
          : !state.domain || state.domain.status !== "ACTIVE"
            ? "domain_pending"
            : !state.deployment || state.deployment.status !== "SUCCEEDED"
              ? "deployment_pending"
              : "publication_check_pending";

    return {
      siteId,
      siteStatus: state.site.status,
      approval: state.approval
        ? { status: state.approval.status, releaseId: state.approval.releaseId, createdAt: state.approval.createdAt }
        : null,
      payment: state.payment
        ? { status: state.payment.status, amount: state.payment.amount, currency: state.payment.currency, paidAt: state.payment.paidAt }
        : { status: "PENDING" },
      domain: state.domain
        ? { hostname: state.domain.hostname, status: state.domain.status, customerStatus: domainCustomerStatus(state.domain.status), expiresAt: state.domain.expiresAt }
        : { status: "NOT_REQUESTED", customerStatus: "not_requested" },
      deployment: state.deployment
        ? { id: state.deployment.id, status: state.deployment.status, message: state.deployment.message, updatedAt: state.deployment.updatedAt }
        : { status: "NOT_STARTED" },
      live: isLive,
      liveUrl: isLive && state.domain ? `https://${state.domain.hostname}` : null,
      nextAction,
    };
  }

  public async createDeployment(input: {
    businessId: string;
    siteId: string;
    releaseId: string;
    actorUserId: string;
    resourceUuid?: string;
  }) {
    await requireBusinessRole(input.businessId, input.actorUserId, ["OWNER", "ADMIN", "SUPER_ADMIN"]);
    return createDeployment({
      businessId: input.businessId,
      siteId: input.siteId,
      releaseId: input.releaseId,
      resourceUuid: input.resourceUuid,
    });
  }

  public async updateDeployment(input: {
    businessId: string;
    deploymentId: string;
    actorUserId: string;
    status: "NOT_STARTED" | "QUEUED" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "BLOCKED";
    externalDeploymentId?: string;
    message?: string;
    startedAt?: Date | null;
    finishedAt?: Date | null;
  }) {
    await requireBusinessRole(input.businessId, input.actorUserId, ["OWNER", "ADMIN", "SUPER_ADMIN"]);
    const result = await updateDeployment({
      businessId: input.businessId,
      deploymentId: input.deploymentId,
      status: input.status,
      externalDeploymentId: input.externalDeploymentId,
      message: input.message,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
    });

    if (result.count === 0) {
      throw new NotFoundException("Deployment not found");
    }

    return { updated: true };
  }
}
