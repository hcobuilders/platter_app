"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type { ProjectStatus, ProjectNoteState } from "@/generated/prisma/enums";
import { parseXer, type ParsedActivity } from "@/lib/xer";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

// Click-to-edit fields on the Overview "Project" container (S-batch #60) —
// one field per call, autosaved on blur, so an edit to one field can never
// clobber a sibling the way a full-form replace would.
type ProjectFieldValues = {
  owner: string | null;
  architectOfRecord: string | null;
  deliveryMethod: string | null;
  status: ProjectStatus;
  bondPct: number | null;
  retainagePct: number | null;
  contractDays: number | null;
};

export async function updateProjectField<K extends keyof ProjectFieldValues>(
  projectNumber: string,
  field: K,
  value: ProjectFieldValues[K]
) {
  await prisma.project.update({
    where: { number: projectNumber },
    data: { [field]: value },
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function updateProjectBonding(projectNumber: string, formData: FormData) {
  const bidBondRequired = formData.get("bidBondRequired") === "on";
  const pAndPMode = str(formData, "pAndPMode");

  await prisma.project.update({
    where: { number: projectNumber },
    data: {
      bidBondRequired,
      pAndPMode: pAndPMode === "" ? null : (pAndPMode as "in_base" | "alternate"),
    },
  });

  revalidatePath(`/projects/${projectNumber}`);
}

export async function updatePackageBonding(projectNumber: string, bidPackageId: string, formData: FormData) {
  const requiresBond = formData.get("requiresBond") === "on";
  const pAndPMode = str(formData, "pAndPMode");

  await prisma.bidPackage.update({
    where: { id: bidPackageId },
    data: {
      requiresBond,
      pAndPMode: pAndPMode === "" ? null : (pAndPMode as "in_base" | "alternate"),
    },
  });

  revalidatePath(`/projects/${projectNumber}`);
}

// Bid bond required now lives as a flag chip, not a checkbox — this just
// flips the underlying boolean. Adding the chip sets it true; right-clicking
// it to remove sets it false.
export async function setBidBondRequired(projectNumber: string, required: boolean) {
  await prisma.project.update({
    where: { number: projectNumber },
    data: { bidBondRequired: required },
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function addProjectFlag(projectNumber: string, flagId: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: projectNumber } });
  await prisma.projectFlag.upsert({
    where: { projectId_flagId: { projectId: project.id, flagId } },
    create: { projectId: project.id, flagId },
    update: {},
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function removeProjectFlag(projectNumber: string, projectFlagId: string) {
  await prisma.projectFlag.delete({ where: { id: projectFlagId } });
  revalidatePath(`/projects/${projectNumber}`);
}

// Geocodes via OpenStreetMap's Nominatim (no API key) — good enough for a
// mini map and a "verified" badge until a real address-verification vendor
// is wired up. Silently no-ops on failure; the UI just stays unverified so
// the owner can retry.
export async function verifyProjectAddress(projectNumber: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: projectNumber } });
  if (!project.address) return;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(project.address)}`;
    const res = await fetch(url, { headers: { "User-Agent": "PlatterApp/1.0 (preconstruction bid tool)" } });
    if (!res.ok) return;
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (results.length === 0) return;
    await prisma.project.update({
      where: { number: projectNumber },
      data: { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), addressVerifiedAt: new Date() },
    });
  } catch {
    // Network hiccup or bad response — leave the project unverified.
  }
  revalidatePath(`/projects/${projectNumber}`);
}

// Hot items now live inline in the Overview container (S-batch #65): a "+"
// glyph opens this instead of a separate boxed form, with a 3-way color
// pick at creation. Author comes from the signed-in session rather than a
// free-text field now that real auth exists.
export async function addHotItem(projectNumber: string, body: string, associatedAtStr: string, state: ProjectNoteState) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const [project, session] = await Promise.all([
    prisma.project.findUniqueOrThrow({ where: { number: projectNumber } }),
    auth(),
  ]);
  await prisma.projectNote.create({
    data: {
      projectId: project.id,
      body: trimmed,
      author: session?.user?.name ?? session?.user?.email ?? "Unknown",
      state,
      pinnedAt: new Date(),
      associatedAt: associatedAtStr ? new Date(associatedAtStr) : null,
    },
  });
  revalidatePath(`/projects/${projectNumber}`);
}

// Existing hot items are click-to-edit, not just add/remove — body text and
// color state both change from the same inline editor.
export async function updateHotItem(projectNumber: string, noteId: string, body: string, state: ProjectNoteState) {
  const trimmed = body.trim();
  if (!trimmed) return;
  await prisma.projectNote.update({
    where: { id: noteId },
    data: { body: trimmed, state },
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function removeHotItem(projectNumber: string, noteId: string) {
  await prisma.projectNote.delete({ where: { id: noteId } });
  revalidatePath(`/projects/${projectNumber}`);
}

// Per-user "unseen item" indicator (S-batch #66), starting with hot items.
// Deliberately does NOT revalidatePath — marking an item seen must not wipe
// its "new" glyph on the very view that's showing it; the change only takes
// effect on the user's next visit.
export async function markItemsSeen(entityType: string, entityIds: string[]) {
  const session = await auth();
  if (!session?.user?.id || entityIds.length === 0) return;
  await prisma.seenItem.createMany({
    data: entityIds.map((entityId) => ({ userId: session.user.id, entityType, entityId })),
    skipDuplicates: true,
  });
}

// Schedule clock start for the awarded-status dashboard card (S-batch #71)
// — a real ProjectDate (notice_to_proceed) rather than a bare field, so it
// shows on the Key Dates timeline like every other project date.
export async function setNoticeToProceed(projectNumber: string, dateStr: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: projectNumber } });
  if (!dateStr) {
    await prisma.projectDate.deleteMany({ where: { projectId: project.id, kind: "notice_to_proceed" } });
    revalidatePath(`/projects/${projectNumber}`);
    return;
  }
  const existing = await prisma.projectDate.findFirst({ where: { projectId: project.id, kind: "notice_to_proceed" } });
  if (existing) {
    await prisma.projectDate.update({ where: { id: existing.id }, data: { at: new Date(dateStr) } });
  } else {
    await prisma.projectDate.create({ data: { projectId: project.id, kind: "notice_to_proceed", at: new Date(dateStr) } });
  }
  revalidatePath(`/projects/${projectNumber}`);
}

// Project-level change orders (S-batch #71) — description + schedule-day
// delta + dollar-value delta, summed for the awarded-status dashboard card.
export async function addChangeOrder(projectNumber: string, description: string, days: number, valueDollars: number) {
  const trimmed = description.trim();
  if (!trimmed) return;
  const project = await prisma.project.findUniqueOrThrow({ where: { number: projectNumber } });
  await prisma.changeOrder.create({
    data: {
      projectId: project.id,
      description: trimmed,
      days: Number.isFinite(days) ? Math.round(days) : 0,
      value: BigInt(Math.round((Number.isFinite(valueDollars) ? valueDollars : 0) * 100)),
    },
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function removeChangeOrder(projectNumber: string, id: string) {
  await prisma.changeOrder.delete({ where: { id } });
  revalidatePath(`/projects/${projectNumber}`);
}

// P6 XER import, step 1 of 2 (S-batch #63): parse only, no writes yet —
// the client holds the returned candidates in a checkbox selection list
// before anything commits. Mirrors importTagsCsv's "read file.text()
// straight in the action" pattern rather than round-tripping through
// storage first, since nothing here needs the original file kept.
export async function parseXerFile(formData: FormData): Promise<ParsedActivity[]> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return [];
  const text = await file.text();
  return parseXer(text);
}

// Step 2: commit only the activities the owner left checked. Each import
// just appends rows — no de-dup against a prior import of the same
// schedule, since re-import collision handling isn't specified yet.
export async function commitScheduleActivities(projectNumber: string, activities: ParsedActivity[]) {
  if (activities.length === 0) return;
  const project = await prisma.project.findUniqueOrThrow({ where: { number: projectNumber } });
  const lastSeq = await prisma.scheduleActivity.aggregate({
    where: { projectId: project.id },
    _max: { seq: true },
  });
  let seq = lastSeq._max.seq ?? 0;
  await prisma.scheduleActivity.createMany({
    data: activities.map((a) => ({
      projectId: project.id,
      activityId: a.activityId,
      name: a.name,
      wbsCategory: a.wbsCategory,
      startAt: a.startAt ? new Date(a.startAt) : null,
      finishAt: a.finishAt ? new Date(a.finishAt) : null,
      durationDays: a.durationDays != null ? Math.round(a.durationDays) : null,
      calendarType: a.calendarType,
      seq: ++seq,
    })),
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function removeScheduleActivity(projectNumber: string, id: string) {
  await prisma.scheduleActivity.delete({ where: { id } });
  revalidatePath(`/projects/${projectNumber}`);
}

// "allow 'pinned' dates by glyph pin and pin_active so some dates always
// show on top" (S-batch #64). Pinned activities sort above every WBS
// group regardless of the 10-row collapse limit.
export async function toggleScheduleActivityPin(projectNumber: string, id: string, pinned: boolean) {
  await prisma.scheduleActivity.update({ where: { id }, data: { pinned } });
  revalidatePath(`/projects/${projectNumber}`);
}
