import { Body, Controller, Get, Headers, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";

import { TenantAuthGuard } from "../auth/tenant-auth.guard.js";
import { FeedbackService } from "./feedback.service.js";

const feedbackSchema = z.object({
  releaseId: z.string().min(1),
  type: z.enum(["FACTUAL_CORRECTION", "CONTENT_ADDITION", "DESIGN_PREFERENCE"]),
  description: z.string().trim().min(1).max(4000),
  dedupeKey: z.string().min(1).max(200).optional(),
});

const approvalSchema = z.object({
  releaseId: z.string().min(1),
});

@Controller("businesses/:businessId/sites/:siteId")
@UseGuards(TenantAuthGuard)
export class FeedbackController {
  public constructor(@Inject(FeedbackService) private readonly feedbackService: FeedbackService) {}

  @Get("feedback")
  public list(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
  ) {
    return this.feedbackService.list(businessId, siteId);
  }

  @Post("feedback")
  public create(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
    @Body() body: unknown,
  ) {
    const input = feedbackSchema.parse(body);
    return this.feedbackService.create({ businessId, siteId, ...input });
  }

  @Get("approvals/:releaseId")
  public getApproval(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
    @Param("releaseId") releaseId: string,
  ) {
    return this.feedbackService.getApproval(businessId, siteId, releaseId);
  }

  @Post("approve")
  public approve(
    @Param("businessId") businessId: string,
    @Param("siteId") siteId: string,
    @Headers("x-user-id") approverUserId: string,
    @Body() body: unknown,
  ) {
    const { releaseId } = approvalSchema.parse(body);
    return this.feedbackService.approve({ businessId, siteId, releaseId, approverUserId });
  }
}
