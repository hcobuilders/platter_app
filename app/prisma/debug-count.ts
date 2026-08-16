import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: "26-085" } });
  const packages = await prisma.bidPackage.findMany({
    where: { projectId: project.id },
    include: { _count: { select: { scopeLineItems: true } } },
  });
  for (const p of packages) {
    console.log(`PKG ${p.code} (${p.name}) id=${p.id} scopeLineItems=${p._count.scopeLineItems}`);
  }
  const allScopeLines = await prisma.scopeLineItem.findMany({ where: { bidPackage: { projectId: project.id } } });
  console.log(`TOTAL scope lines across project: ${allScopeLines.length}`);
  for (const l of allScopeLines) {
    console.log(`  - ${l.id} pkg=${l.bidPackageId} "${l.description}"`);
  }
  const orphanBidLines = await prisma.bidLine.findMany({
    where: { scopeLineItemId: null, bid: { invitation: { bidPackage: { projectId: project.id } } } },
    include: { bid: { include: { invitation: { include: { subcontractor: true } } } } },
  });
  console.log(`Orphan (null scopeLineItemId) bid lines: ${orphanBidLines.length}`);
  for (const b of orphanBidLines) {
    console.log(`  - ${b.id} sub=${b.bid.invitation.subcontractor.name} amount=${b.amount} note="${b.note}"`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
