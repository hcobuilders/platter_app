"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ProjectStatus } from "@/generated/prisma/enums";

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

export async function addHotItem(projectNumber: string, body: string, associatedAtStr: string, author: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { number: projectNumber } });
  const trimmed = body.trim();
  if (!trimmed) return;
  await prisma.projectNote.create({
    data: {
      projectId: project.id,
      body: trimmed,
      author: author.trim() || "Unknown",
      pinnedAt: new Date(),
      associatedAt: associatedAtStr ? new Date(associatedAtStr) : null,
    },
  });
  revalidatePath(`/projects/${projectNumber}`);
}

export async function removeHotItem(projectNumber: string, noteId: string) {
  await prisma.projectNote.delete({ where: { id: noteId } });
  revalidatePath(`/projects/${projectNumber}`);
}
