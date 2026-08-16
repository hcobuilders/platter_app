"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/format";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function updateBudgetLine(projectNumber: string, id: string, formData: FormData) {
  const budget = str(formData, "budget");
  const current = str(formData, "current");
  const buyoutExpected = str(formData, "buyoutExpected");
  const awardedTo = str(formData, "awardedTo");

  await prisma.budgetLine.update({
    where: { id },
    data: {
      budget: dollarsToCents(Number(budget)),
      current: dollarsToCents(Number(current)),
      buyoutExpected: buyoutExpected === "" ? null : dollarsToCents(Number(buyoutExpected)),
      awardedTo: awardedTo === "" ? null : awardedTo,
    },
  });

  revalidatePath(`/projects/${projectNumber}/budget`);
}

async function nextRevNo(projectId: string): Promise<number> {
  const lastRev = await prisma.budgetRevision.aggregate({
    where: { projectId },
    _max: { revNo: true },
  });
  return (lastRev._max.revNo ?? -1) + 1;
}

async function snapshotCurrent(projectId: string) {
  const budgetLines = await prisma.budgetLine.findMany({ where: { projectId } });
  return Object.fromEntries(budgetLines.map((b) => [b.description, Number(b.current)]));
}

export async function saveBudgetRevision(projectId: string, projectNumber: string, formData: FormData) {
  const note = str(formData, "note");

  await prisma.budgetRevision.create({
    data: {
      projectId,
      revNo: await nextRevNo(projectId),
      note: note || null,
      createdBy: "Prototype user",
      snapshot: await snapshotCurrent(projectId),
    },
  });

  revalidatePath(`/projects/${projectNumber}/budget`);
}

// Restores every budget line's "current" value from a past revision's
// snapshot (matched by description, same key saveBudgetRevision uses).
// Saves today's numbers as a revision first so the rollback itself is
// never destructive, then records a second revision for the rolled-back
// state — both show up in History same as any other edit.
export async function rollbackToRevision(projectId: string, projectNumber: string, targetRevNo: number) {
  const target = await prisma.budgetRevision.findUnique({
    where: { projectId_revNo: { projectId, revNo: targetRevNo } },
  });
  if (!target) return;

  await prisma.budgetRevision.create({
    data: {
      projectId,
      revNo: await nextRevNo(projectId),
      note: `Auto-saved before rollback to Rev ${targetRevNo}`,
      createdBy: "Prototype user",
      snapshot: await snapshotCurrent(projectId),
    },
  });

  const snapshot = target.snapshot as Record<string, number>;
  const budgetLines = await prisma.budgetLine.findMany({ where: { projectId } });
  for (const line of budgetLines) {
    const value = snapshot[line.description];
    if (value === undefined) continue;
    await prisma.budgetLine.update({ where: { id: line.id }, data: { current: BigInt(value) } });
  }

  await prisma.budgetRevision.create({
    data: {
      projectId,
      revNo: await nextRevNo(projectId),
      note: `Rolled back to Rev ${targetRevNo}`,
      createdBy: "Prototype user",
      snapshot: await snapshotCurrent(projectId),
    },
  });

  revalidatePath(`/projects/${projectNumber}/budget`);
}
