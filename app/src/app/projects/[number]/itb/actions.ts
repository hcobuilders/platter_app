"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function inviteSubcontractor(projectNumber: string, bidPackageId: string, formData: FormData) {
  const existingId = str(formData, "existingSubcontractorId");
  const name = str(formData, "newSubName");

  let subcontractorId = existingId;
  if (!subcontractorId && name) {
    const trade = str(formData, "newSubTrade");
    const sub = await prisma.subcontractor.create({
      data: { name, trades: trade ? [trade] : [] },
    });
    subcontractorId = sub.id;
  }
  if (!subcontractorId) return;

  const token = randomBytes(16).toString("hex");

  await prisma.invitation.upsert({
    where: { bidPackageId_subcontractorId: { bidPackageId, subcontractorId } },
    update: {},
    create: {
      bidPackageId,
      subcontractorId,
      token,
      intent: "none",
    },
  });

  revalidatePath(`/projects/${projectNumber}/itb`);
}

// Stubbed send (per owner decision) — marks the invite as sent without calling
// any real mail provider. A real implementation swaps this for Microsoft
// Graph sendMail behind the Mailer interface (D-14).
export async function sendInvite(projectNumber: string, invitationId: string) {
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { sentAt: new Date() },
  });
  revalidatePath(`/projects/${projectNumber}/itb`);
}
