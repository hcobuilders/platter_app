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

// Project archiving (S-batch #72) — wires up the dashboard kebab's
// previously-disabled "Archive project" stub.
export async function archiveProject(projectNumber: string) {
  await prisma.project.update({ where: { number: projectNumber }, data: { archivedAt: new Date() } });
  revalidatePath("/");
}

export async function unarchiveProject(projectNumber: string) {
  await prisma.project.update({ where: { number: projectNumber }, data: { archivedAt: null } });
  revalidatePath("/");
}

// Dashboard card drag-to-reorder (S-notes v135a475): admin-only, one order
// shared by every user — same singleton-settings shape as the schedule row
// height setting.
export async function setDashboardOrder(order: string[]) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Admin access required");
  await prisma.dashboardLayoutSetting.upsert({
    where: { key: "global" },
    create: { key: "global", order },
    update: { order },
  });
  revalidatePath("/");
}

// "Save as template" (S-batch #72) — wires up the dashboard kebab's
// previously-disabled "Duplicate as template" stub. Captures bid package
// code/name/csiCodes and the invited bidder list only — deliberately no
// cost data, project info, or scope line items, per the owner's spec.
// Also reused by the Settings "+" create flow (S-batch #55), which is why
// name/description are overridable rather than always auto-derived.
export async function saveProjectAsTemplate(projectNumber: string, name?: string, description?: string) {
  const project = await prisma.project.findUnique({
    where: { number: projectNumber },
    include: {
      bidPackages: {
        include: { invitations: { include: { subcontractor: true } } },
      },
    },
  });
  if (!project) return;

  await prisma.projectTemplate.create({
    data: {
      name: name?.trim() || `${project.name} — Template`,
      description: description?.trim() || null,
      sourceProject: project.name,
      packages: {
        create: project.bidPackages.map((pkg) => ({
          code: pkg.code,
          name: pkg.name,
          csiCodes: pkg.csiCodes,
          bidders: pkg.invitations.map((inv) => ({
            subcontractorId: inv.subcontractorId,
            name: inv.subcontractor.name,
          })),
        })),
      },
    },
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function deleteProjectTemplate(templateId: string) {
  await prisma.projectTemplate.delete({ where: { id: templateId } });
  revalidatePath("/settings");
}

// Card "Edit" button (S-batch #55) — rename/re-describe a saved template.
export async function updateProjectTemplate(templateId: string, name: string, description: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await prisma.projectTemplate.update({
    where: { id: templateId },
    data: { name: trimmed, description: description.trim() || null },
  });
  revalidatePath("/settings");
}

// S-notes v135a475: "i should be able to view and edit the project
// templates" — the edit modal only covered name/description; this exposes
// the captured packages/bidders too so a stale package or bidder can be
// dropped without deleting and re-saving the whole template.
export async function removeTemplatePackage(templatePackageId: string) {
  await prisma.templatePackage.delete({ where: { id: templatePackageId } });
  revalidatePath("/settings");
}

export async function removeTemplateBidder(templatePackageId: string, bidderIndex: number) {
  const pkg = await prisma.templatePackage.findUnique({ where: { id: templatePackageId } });
  if (!pkg) return;
  const bidders = Array.isArray(pkg.bidders) ? pkg.bidders : [];
  const next = bidders.filter((_, i) => i !== bidderIndex);
  await prisma.templatePackage.update({ where: { id: templatePackageId }, data: { bidders: next } });
  revalidatePath("/settings");
}
