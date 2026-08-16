// One-off delta seed for production: adds 3B/3C packages and renames 3A,
// without touching any of the non-idempotent seed.ts data (subs, bids,
// scope lines, etc.). Safe to re-run — every operation here is an upsert
// keyed on a unique constraint.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: "26-085" } });

  await prisma.bidPackage.update({
    where: { projectId_code: { projectId: project.id, code: "3A" } },
    data: { name: "CIP Concrete" },
  });

  const pkg3B = await prisma.bidPackage.upsert({
    where: { projectId_code: { projectId: project.id, code: "3B" } },
    update: { name: "Site Concrete" },
    create: {
      projectId: project.id,
      code: "3B",
      name: "Site Concrete",
      csiCodes: ["03 30 00"],
      status: "scoping",
      budgetAmount: 180_000_00n,
    },
  });
  const pkg3C = await prisma.bidPackage.upsert({
    where: { projectId_code: { projectId: project.id, code: "3C" } },
    update: { name: "Precast Concrete Structure" },
    create: {
      projectId: project.id,
      code: "3C",
      name: "Precast Concrete Structure",
      csiCodes: ["03 40 00"],
      status: "scoping",
      budgetAmount: 420_000_00n,
    },
  });

  await prisma.budgetLine.updateMany({
    where: { projectId: project.id, description: "3A — Concrete" },
    data: { description: "3A — CIP Concrete" },
  });

  const existingB = await prisma.budgetLine.findFirst({ where: { bidPackageId: pkg3B.id } });
  if (!existingB) {
    await prisma.budgetLine.create({
      data: { projectId: project.id, bidPackageId: pkg3B.id, csiCode: "03", description: "3B — Site Concrete", budget: 180_000_00n, current: 180_000_00n, tags: [] },
    });
  }
  const existingC = await prisma.budgetLine.findFirst({ where: { bidPackageId: pkg3C.id } });
  if (!existingC) {
    await prisma.budgetLine.create({
      data: { projectId: project.id, bidPackageId: pkg3C.id, csiCode: "03", description: "3C — Precast Concrete Structure", budget: 420_000_00n, current: 420_000_00n, tags: [] },
    });
  }

  console.log("Delta seed applied: 3A renamed, 3B/3C ensured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
