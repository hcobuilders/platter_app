// One-off: seed scripts across the different project seed files never
// checked for an existing Subcontractor by name before creating one, so
// the same real-world sub (e.g. "Bayline Concrete") ended up as multiple
// separate rows. Harmless until the new "Add bidders" modal made it
// visible: an already-invited sub's duplicate row shows up as "available"
// to invite again. Merges each duplicate group into its earliest row,
// re-pointing invitations/communications/contacts, unioning csiCodes.
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const dupeGroups = await prisma.subcontractor.groupBy({
    by: ["name"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  for (const group of dupeGroups) {
    const rows = await prisma.subcontractor.findMany({
      where: { name: group.name },
      orderBy: { id: "asc" },
    });
    const [survivor, ...dupes] = rows;
    const mergedCsi = Array.from(new Set([...survivor.csiCodes, ...dupes.flatMap((d) => d.csiCodes)]));
    const mergedTrades = Array.from(new Set([...survivor.trades, ...dupes.flatMap((d) => d.trades)]));

    for (const dupe of dupes) {
      // Re-point invitations; drop any that would collide with an
      // existing (bidPackageId, subcontractorId) pair on the survivor.
      const dupeInvitations = await prisma.invitation.findMany({ where: { subcontractorId: dupe.id } });
      for (const inv of dupeInvitations) {
        const collision = await prisma.invitation.findUnique({
          where: { bidPackageId_subcontractorId: { bidPackageId: inv.bidPackageId, subcontractorId: survivor.id } },
        });
        if (collision) {
          await prisma.invitation.delete({ where: { id: inv.id } });
        } else {
          await prisma.invitation.update({ where: { id: inv.id }, data: { subcontractorId: survivor.id } });
        }
      }
      await prisma.subContact.updateMany({ where: { subcontractorId: dupe.id }, data: { subcontractorId: survivor.id } });
      await prisma.communication.updateMany({ where: { subcontractorId: dupe.id }, data: { subcontractorId: survivor.id } });
      await prisma.subcontractor.delete({ where: { id: dupe.id } });
      console.log(`Merged duplicate "${dupe.name}" (${dupe.id}) into ${survivor.id}`);
    }

    await prisma.subcontractor.update({
      where: { id: survivor.id },
      data: { csiCodes: mergedCsi, trades: mergedTrades },
    });
  }

  console.log(`Done — merged ${dupeGroups.length} duplicate group(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
