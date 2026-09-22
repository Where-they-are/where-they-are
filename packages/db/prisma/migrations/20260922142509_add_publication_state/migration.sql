-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'BLOCKED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "siteId" TEXT;

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "resourceUuid" TEXT,
    "externalDeploymentId" TEXT,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deployment_businessId_siteId_createdAt_idx" ON "Deployment"("businessId", "siteId", "createdAt");

-- CreateIndex
CREATE INDEX "Deployment_releaseId_status_idx" ON "Deployment"("releaseId", "status");

-- CreateIndex
CREATE INDEX "Payment_siteId_status_idx" ON "Payment"("siteId", "status");

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "SiteRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
