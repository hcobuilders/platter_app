-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('location', 'requirement', 'project_type', 'contract_type', 'special');

-- AlterTable
ALTER TABLE "Flag" ADD COLUMN     "color" TEXT,
ADD COLUMN     "glyph" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "type" "TagType" NOT NULL DEFAULT 'special';
