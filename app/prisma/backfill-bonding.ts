// One-off: backfills the new bidBondRequired/pAndPMode fields onto
// already-seeded projects without re-running the (non-idempotent) full
// seed scripts.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.project.updateMany({
    where: { number: { in: ["26-085", "599-444"] } },
    data: { bidBondRequired: true, pAndPMode: "in_base" },
  });
  console.log(`Backfilled bonding fields on ${result.count} project(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
