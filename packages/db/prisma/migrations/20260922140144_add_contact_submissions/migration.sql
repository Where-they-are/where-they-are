-- CreateEnum
CREATE TYPE "ContactSubmissionStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "siteId" TEXT,
    "dedupeKey" TEXT,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT,
    "senderPhone" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "starredAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSubmission_businessId_status_createdAt_idx" ON "ContactSubmission"("businessId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_businessId_starred_idx" ON "ContactSubmission"("businessId", "starred");

-- CreateIndex
CREATE INDEX "ContactSubmission_retentionUntil_idx" ON "ContactSubmission"("retentionUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ContactSubmission_businessId_dedupeKey_key" ON "ContactSubmission"("businessId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
