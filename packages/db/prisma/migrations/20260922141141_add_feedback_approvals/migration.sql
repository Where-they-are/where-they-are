-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('FACTUAL_CORRECTION', 'CONTENT_ADDITION', 'DESIGN_PREFERENCE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'REVOKED');

-- CreateTable
CREATE TABLE "SiteFeedback" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'SUBMITTED',
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SiteFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteApproval" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SiteApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteFeedback_businessId_siteId_createdAt_idx" ON "SiteFeedback"("businessId", "siteId", "createdAt");

-- CreateIndex
CREATE INDEX "SiteFeedback_releaseId_status_idx" ON "SiteFeedback"("releaseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SiteFeedback_businessId_dedupeKey_key" ON "SiteFeedback"("businessId", "dedupeKey");

-- CreateIndex
CREATE INDEX "SiteApproval_businessId_siteId_createdAt_idx" ON "SiteApproval"("businessId", "siteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteApproval_businessId_releaseId_key" ON "SiteApproval"("businessId", "releaseId");

-- AddForeignKey
ALTER TABLE "SiteFeedback" ADD CONSTRAINT "SiteFeedback_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteFeedback" ADD CONSTRAINT "SiteFeedback_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteFeedback" ADD CONSTRAINT "SiteFeedback_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "SiteRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteApproval" ADD CONSTRAINT "SiteApproval_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteApproval" ADD CONSTRAINT "SiteApproval_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteApproval" ADD CONSTRAINT "SiteApproval_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "SiteRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
