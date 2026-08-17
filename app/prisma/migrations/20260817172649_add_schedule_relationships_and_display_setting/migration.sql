-- CreateEnum
CREATE TYPE "ScheduleRelType" AS ENUM ('FS', 'SS');

-- CreateTable
CREATE TABLE "ScheduleRelationship" (
    "id" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "type" "ScheduleRelType" NOT NULL,

    CONSTRAINT "ScheduleRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleDisplaySetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'global',
    "rowHeight" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "ScheduleDisplaySetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRelationship_predecessorId_successorId_key" ON "ScheduleRelationship"("predecessorId", "successorId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDisplaySetting_key_key" ON "ScheduleDisplaySetting"("key");

-- AddForeignKey
ALTER TABLE "ScheduleRelationship" ADD CONSTRAINT "ScheduleRelationship_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "ScheduleActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRelationship" ADD CONSTRAINT "ScheduleRelationship_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "ScheduleActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
