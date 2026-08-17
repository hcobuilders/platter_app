-- CreateEnum
CREATE TYPE "ProjectNoteState" AS ENUM ('neutral', 'risk', 'resolved');

-- AlterTable
ALTER TABLE "ProjectNote" ADD COLUMN     "state" "ProjectNoteState" NOT NULL DEFAULT 'neutral';
