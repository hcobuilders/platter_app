"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type { ProjectStatus } from "@/generated/prisma/enums";

// Click-the-pill status change on a dashboard project card (S-batch #71).
export async function updateProjectStatusFromCard(projectNumber: string, status: ProjectStatus) {
  await prisma.project.update({ where: { number: projectNumber }, data: { status } });
  revalidatePath("/");
}

// Multi-select dashboard filter chips, persisted per user rather than
// browser session (S-batch #71) — "remember what i last had selected and
// always show me that filter."
export async function setDashboardStatusFilters(filters: string[]) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { dashboardStatusFilters: filters },
  });
  // No revalidatePath — this is UI state the dashboard already reflects
  // optimistically client-side; the persisted value only matters on the
  // user's next visit/reload.
}
