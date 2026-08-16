-- CreateEnum
CREATE TYPE "EditSource" AS ENUM ('user', 'agent', 'agent_confirmed');

-- CreateTable
CREATE TABLE "FieldEdit" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "source" "EditSource" NOT NULL,
    "agentName" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "FieldEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FieldEdit_entityType_entityId_idx" ON "FieldEdit"("entityType", "entityId");
