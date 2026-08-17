import { prisma } from "@/lib/db";

// Read side of the per-user "unseen item" indicator (S-batch #66). Returns
// the subset of entityIds this user has already viewed, so callers can mark
// the rest as new. Write side (markItemsSeen) lives in each surface's own
// "use server" actions file since it needs the current session.
export async function getSeenIds(userId: string, entityType: string, entityIds: string[]): Promise<Set<string>> {
  if (entityIds.length === 0) return new Set();
  const rows = await prisma.seenItem.findMany({
    where: { userId, entityType, entityId: { in: entityIds } },
    select: { entityId: true },
  });
  return new Set(rows.map((r) => r.entityId));
}
