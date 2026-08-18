-- CreateTable
CREATE TABLE "DashboardLayoutSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'global',
    "order" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "DashboardLayoutSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLayoutSetting_key_key" ON "DashboardLayoutSetting"("key");
