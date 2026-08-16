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

export async function saveBudgetRevision(projectId: string, projectNumber: string, formData: FormData) {
  const note = str(formData, "note");
  const budgetLines = await prisma.budgetLine.findMany({ where: { projectId } });

  const lastRev = await prisma.budgetRevision.aggregate({
    where: { projectId },
    _max: { revNo: true },
  });

  const snapshot = Object.fromEntries(
    budgetLines.map((b) => [b.description, Number(b.current)])
  );

  await prisma.budgetRevision.create({
    data: {
      projectId,
      revNo: (lastRev._max.revNo ?? -1) + 1,
      note: note || null,
      createdBy: "Prototype user",
      snapshot,
    },
  });

  revalidatePath(`/projects/${projectNumber}/budget`);
}
