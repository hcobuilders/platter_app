// One-off repair: the three scope_line_item rows for package 3A were found
// missing from production (0 scope lines, 6 orphaned bid_lines with
// scopeLineItemId=null — see prisma/debug-count.ts output). Root cause
// wasn't conclusively identified, but the fix is straightforward: recreate
// the three lines from the known-good seed.ts source of truth, relink the
// orphaned bid_lines that match them by amount+sub, and remove the one
// orphan that isn't part of the original seed (a stray "Accepted
// recommended plug" line that shouldn't exist in the clean demo state).

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: "26-085" } });
  const pkg3A = await prisma.bidPackage.findUniqueOrThrow({
    where: { projectId_code: { projectId: project.id, code: "3A" } },
  });

  const existingCount = await prisma.scopeLineItem.count({ where: { bidPackageId: pkg3A.id } });
  if (existingCount > 0) {
    console.log(`3A already has ${existingCount} scope lines — nothing to repair.`);
    return;
  }

  const lineCip = await prisma.scopeLineItem.create({
    data: {
      bidPackageId: pkg3A.id,
      seq: 1,
      csiCode: "03 30 00",
      description: "Cast-in-place foundation walls",
      unit: "LS",
      kind: "inclusion",
    },
  });
  const lineSlab = await prisma.scopeLineItem.create({
    data: {
      bidPackageId: pkg3A.id,
      seq: 2,
      csiCode: "03 30 00",
      description: 'Slab on grade, 6" reinforced',
      unit: "LS",
      kind: "inclusion",
    },
  });
  const lineAlt = await prisma.scopeLineItem.create({
    data: {
      bidPackageId: pkg3A.id,
      seq: 3,
      csiCode: "03 35 00",
      description: "Alternate — polished slab finish",
      unit: "LS",
      kind: "alternate",
      isRequired: false,
    },
  });
  console.log("Recreated 3 scope lines:", lineCip.id, lineSlab.id, lineAlt.id);

  const orphans = await prisma.bidLine.findMany({
    where: { scopeLineItemId: null, bid: { invitation: { bidPackage: { projectId: project.id } } } },
    include: { bid: { include: { invitation: { include: { subcontractor: true } } } } },
  });

  for (const b of orphans) {
    const subName = b.bid.invitation.subcontractor.name;
    if (subName === "Bayline Concrete" && b.amount === 187_400_00n) {
      await prisma.bidLine.update({ where: { id: b.id }, data: { scopeLineItemId: lineCip.id } });
      console.log("Relinked Bayline CIP line");
    } else if (subName === "Bayline Concrete" && b.amount === 294_000_00n) {
      await prisma.bidLine.update({ where: { id: b.id }, data: { scopeLineItemId: lineSlab.id } });
      console.log("Relinked Bayline Slab line");
    } else if (subName === "Bayline Concrete" && b.amount === 31_500_00n) {
      await prisma.bidLine.update({ where: { id: b.id }, data: { scopeLineItemId: lineAlt.id } });
      console.log("Relinked Bayline Alt line");
    } else if (subName === "Marion Ready Mix & Forming" && b.amount === 191_000_00n) {
      await prisma.bidLine.update({ where: { id: b.id }, data: { scopeLineItemId: lineCip.id } });
      console.log("Relinked Marion CIP line");
    } else if (b.note === "Accepted recommended plug") {
      await prisma.bidLine.delete({ where: { id: b.id } });
      console.log("Deleted stray plug artifact:", b.id);
    } else if (b.note?.includes("Rebar supply")) {
      console.log("Left genuine sub-added Rebar line unlinked (expected):", b.id);
    } else {
      console.log("UNRECOGNIZED orphan, left as-is — needs manual review:", b.id, subName, b.amount, b.note);
    }
  }

  console.log("Repair complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
