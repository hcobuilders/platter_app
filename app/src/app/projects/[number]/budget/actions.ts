"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/format";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

// "it is a new entity part of the subcontracts / commitments tool. Once
// it is awarded and commitment is executed it would show here." (S-batch
// #71) — this Budget-page action is the minimal slice of that future tool:
// marking an awarded line's subcontract as executed, one Commitment per
// BudgetLine.
export async function executeCommitment(projectNumber: string, budgetLineId: string) {
  const line = await prisma.budgetLine.findUniqueOrThrow({ where: { id: budgetLineId } });
  if (!line.awardedTo) return;
  await prisma.commitment.upsert({
    where: { budgetLineId },
    create: { projectId: line.projectId, budgetLineId, subcontractorName: line.awardedTo, amount: line.current },
    update: { subcontractorName: line.awardedTo, amount: line.current, executedAt: new Date() },
  });
  revalidatePath(`/projects/${projectNumber}/budget`);
  revalidatePath("/");
}

export async function revokeCommitment(projectNumber: string, budgetLineId: string) {
  await prisma.commitment.deleteMany({ where: { budgetLineId } });
  revalidatePath(`/projects/${projectNumber}/budget`);
  revalidatePath("/");
}

export async function updateBudgetLine(projectNumber: string, id: string, formData: FormData) {
  const budget = str(formData, "budget");
  const current = str(formData, "current");
  const awardedTo = str(formData, "awardedTo");

  const budgetCents = dollarsToCents(Number(budget));
  const currentCents = dollarsToCents(Number(current));

  await prisma.budgetLine.update({
    where: { id },
    data: {
      budget: budgetCents,
      current: currentCents,
      // Derived, not entered (S-notes v135a475: "expected buyout should
      // auto calc from the line budget-current") — always recomputed from
      // whatever budget/current land in this same save, never trusted
      // from a client-submitted value.
      buyoutExpected: budgetCents - currentCents,
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
