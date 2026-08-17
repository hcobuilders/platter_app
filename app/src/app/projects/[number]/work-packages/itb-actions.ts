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

  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

// Stubbed send (per owner decision) — marks the invite as sent without calling
// any real mail provider. A real implementation swaps this for Microsoft
// Graph sendMail behind the Mailer interface (D-14). Also used for "Resend"
// (re-touches sentAt) since the stub has no separate delivery step to redo.
export async function sendInvite(projectNumber: string, invitationId: string) {
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { sentAt: new Date() },
  });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

export async function bulkSendInvites(projectNumber: string, invitationIds: string[]) {
  if (invitationIds.length === 0) return;
  await prisma.invitation.updateMany({
    where: { id: { in: invitationIds } },
    data: { sentAt: new Date() },
  });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

export async function updateInvitationIntent(
  projectNumber: string,
  invitationId: string,
  intent: "none" | "bidding" | "no_bid"
) {
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { intent },
  });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

export async function removeInvitation(projectNumber: string, invitationId: string) {
  await prisma.invitation.delete({ where: { id: invitationId } });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

export async function bulkRemoveInvitations(projectNumber: string, invitationIds: string[]) {
  if (invitationIds.length === 0) return;
  await prisma.invitation.deleteMany({ where: { id: { in: invitationIds } } });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}
