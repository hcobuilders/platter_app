-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardStatusFilters" TEXT[] DEFAULT ARRAY[]::TEXT[];
