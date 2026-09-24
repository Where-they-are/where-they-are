import { Injectable, NotFoundException } from "@nestjs/common";
import {
	createSiteApproval,
	createSiteFeedback,
	findSiteApproval,
	listSiteFeedback,
	requireBusinessRole,
} from "@where-they-are/db";

@Injectable()
export class FeedbackService {
	public list(businessId: string, siteId: string) {
		return listSiteFeedback(businessId, siteId);
	}

	public async create(input: {
		businessId: string;
		siteId: string;
		releaseId: string;
		type: "FACTUAL_CORRECTION" | "CONTENT_ADDITION" | "DESIGN_PREFERENCE";
		description: string;
		dedupeKey?: string;
	}) {
		return createSiteFeedback(input);
	}

	public async approve(input: {
		businessId: string;
		siteId: string;
		releaseId: string;
		approverUserId: string;
	}) {
		await requireBusinessRole(input.businessId, input.approverUserId, [
			"OWNER",
			"ADMIN",
			"SUPER_ADMIN",
		]);
		return createSiteApproval({
			approvedBy: input.approverUserId,
			businessId: input.businessId,
			releaseId: input.releaseId,
			siteId: input.siteId,
		});
	}

	public async getApproval(
		businessId: string,
		siteId: string,
		releaseId: string
	) {
		const approval = await findSiteApproval(businessId, siteId, releaseId);

		if (!approval) {
			throw new NotFoundException("Approval not found");
		}

		return approval;
	}
}
