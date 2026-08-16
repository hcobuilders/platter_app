// One-off repair: package 3A ended up with duplicate scope lines (one set
// from the original seed, a second set from the earlier data-loss-incident
// repair script re-creating lines that turned out not to actually be gone).
// For each duplicate seq, keeps whichever row has real references (BidLine
// or LifecycleScenario) and deletes the other — only if the one being
// deleted has zero references anywhere, verified before every delete.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: "26-085" } });
  const pkg = await prisma.bidPackage.findFirstOrThrow({ where: { projectId: project.id, code: "3A" } });
  const lines = await prisma.scopeLineItem.findMany({
    where: { bidPackageId: pkg.id },
    include: { _count: { select: { bidLines: true, lifecycleScenarios: true } } },
    orderBy: { seq: "asc" },
  });

  const bySeq = new Map<number, typeof lines>();
  for (const l of lines) {
    const arr = bySeq.get(l.seq) ?? [];
    arr.push(l);
    bySeq.set(l.seq, arr);
  }

  for (const [seq, group] of bySeq) {
    if (group.length <= 1) continue;
    console.log(`seq ${seq}: ${group.length} duplicates found`);
    const referenced = group.filter((l) => l._count.bidLines > 0 || l._count.lifecycleScenarios > 0);
    const unreferenced = group.filter((l) => l._count.bidLines === 0 && l._count.lifecycleScenarios === 0);

    if (referenced.length === group.length || unreferenced.length === 0) {
      console.log(`  skipping — all ${group.length} rows are referenced, nothing safe to delete`);
      continue;
    }

    // Keep one row: prefer a referenced one, else the oldest.
    const keep = referenced[0] ?? group[0];
    const toDelete = group.filter((l) => l.id !== keep.id && l._count.bidLines === 0 && l._count.lifecycleScenarios === 0);

    for (const l of toDelete) {
      console.log(`  deleting unreferenced duplicate ${l.id} ("${l.description}")`);
      await prisma.scopeLineItem.delete({ where: { id: l.id } });
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
