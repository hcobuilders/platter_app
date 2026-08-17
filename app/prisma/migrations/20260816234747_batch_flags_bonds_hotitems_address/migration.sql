-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "bondIncluded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BidPackage" ADD COLUMN     "bondAcceptedInvitationId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "addressVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProjectNote" ADD COLUMN     "associatedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "BidPackage" ADD CONSTRAINT "BidPackage_bondAcceptedInvitationId_fkey" FOREIGN KEY ("bondAcceptedInvitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
