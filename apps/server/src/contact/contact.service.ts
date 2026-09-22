import { Injectable, NotFoundException } from "@nestjs/common";
import {
  createContactSubmission,
  findContactSubmissionForBusiness,
  findPublicSiteForContact,
  listContactSubmissionsForBusiness,
  markContactSubmissionRead,
  setContactSubmissionStarred,
  updateContactSubmissionStatus,
} from "@where-they-are/db";

const retentionWindowMs = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class ContactService {
  public async createPublic(input: {
    siteId: string;
    dedupeKey?: string;
    senderName: string;
    senderEmail?: string;
    senderPhone?: string;
    message: string;
  }) {
    const site = await findPublicSiteForContact(input.siteId);

    if (!site) {
      throw new NotFoundException("Public site not found");
    }

    const submission = await createContactSubmission({
      businessId: site.businessId,
      siteId: site.id,
      dedupeKey: input.dedupeKey,
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      senderPhone: input.senderPhone,
      message: input.message,
      retentionUntil: new Date(Date.now() + retentionWindowMs),
    });

    return {
      id: submission.id,
      receivedAt: submission.createdAt,
      message: "Your enquiry was received.",
    };
  }

  public list(businessId: string) {
    return listContactSubmissionsForBusiness(businessId);
  }

  public async get(businessId: string, submissionId: string) {
    const submission = await findContactSubmissionForBusiness(businessId, submissionId);

    if (!submission) {
      throw new NotFoundException("Enquiry not found");
    }

    return submission;
  }

  public async markRead(businessId: string, submissionId: string) {
    const result = await markContactSubmissionRead(businessId, submissionId);

    if (result.count === 0) {
      throw new NotFoundException("Enquiry not found");
    }

    return this.get(businessId, submissionId);
  }

  public async setStarred(businessId: string, submissionId: string, starred: boolean) {
    const result = await setContactSubmissionStarred({ businessId, submissionId, starred });

    if (result.count === 0) {
      throw new NotFoundException("Enquiry not found");
    }

    return this.get(businessId, submissionId);
  }

  public async setStatus(
    businessId: string,
    submissionId: string,
    status: "NEW" | "READ" | "ARCHIVED" | "EXPIRED",
  ) {
    const result = await updateContactSubmissionStatus({ businessId, submissionId, status });

    if (result.count === 0) {
      throw new NotFoundException("Enquiry not found");
    }

    return this.get(businessId, submissionId);
  }
}
