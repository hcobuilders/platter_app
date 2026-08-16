"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function acceptPlug(
  projectNumber: string,
  bidId: string,
  scopeLineItemId: string,
  amountCents: bigint
) {
  await prisma.bidLine.create({
    data: {
      bidId,
      scopeLineItemId,
      amount: amountCents,
      included: true,
      source: "plug",
      note: "Accepted recommended plug",
    },
  });
  revalidatePath(`/projects/${projectNumber}/bid-tab`);
}

export async function acceptSubAddedAsScopeLine(projectNumber: string, bidLineId: string, bidPackageId: string) {
  const bidLine = await prisma.bidLine.findUniqueOrThrow({ where: { id: bidLineId } });
  const lastSeq = await prisma.scopeLineItem.aggregate({
    where: { bidPackageId },
    _max: { seq: true },
  });

  const scopeLine = await prisma.scopeLineItem.create({
    data: {
      bidPackageId,
      seq: (lastSeq._max.seq ?? 0) + 1,
      description: bidLine.note ?? "Sub-added line",
      kind: bidLine.included ? "inclusion" : "exclusion",
    },
  });

  await prisma.bidLine.update({
    where: { id: bidLineId },
    data: { scopeLineItemId: scopeLine.id },
  });

  revalidatePath(`/projects/${projectNumber}/bid-tab`);
}

export async function trackOnlySubAdded(projectNumber: string, bidLineId: string) {
  await prisma.bidLine.update({
    where: { id: bidLineId },
    data: { included: false },
  });
  revalidatePath(`/projects/${projectNumber}/bid-tab`);
}
