-- CreateEnum
CREATE TYPE "PAndPMode" AS ENUM ('in_base', 'alternate');

-- AlterTable
ALTER TABLE "BidPackage" ADD COLUMN     "pAndPMode" "PAndPMode";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "bidBondRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pAndPMode" "PAndPMode";
