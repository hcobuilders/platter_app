"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { FlagType, TagType, UserRole } from "@/generated/prisma/enums";
import { saveFile } from "@/lib/storage";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Admin access required");
  return session;
}

// Per-user profile section (S-batch #57) — name/phone/signature for the
// signed-in user, not scoped by project like the rest of Settings.
export async function updateAccountProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const name = str(formData, "name");
  const phone = str(formData, "phone");
  const emailSignature = str(formData, "emailSignature");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      phone: phone || null,
      emailSignature: emailSignature || null,
    },
  });
  revalidatePath("/settings");
}

function parseKeywordsList(fd: FormData): string[] {
  return str(fd, "parseKeywords")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function createFlag(formData: FormData) {
  const label = str(formData, "label");
  const type = str(formData, "type") as FlagType;
  if (!label) return;
  await prisma.flag.create({
    data: {
      label,
      type,
      description: str(formData, "description") || null,
      color: str(formData, "color") || null,
      glyph: str(formData, "glyph") || null,
      parseKeywords: parseKeywordsList(formData),
    },
  });
  revalidatePath("/settings");
}

// "allow edit of existing there is no edit only delete" (S-batch #52).
export async function updateFlag(id: string, formData: FormData) {
  const label = str(formData, "label");
  const type = str(formData, "type") as FlagType;
  if (!label) return;
  await prisma.flag.update({
    where: { id },
    data: {
      label,
      type,
      description: str(formData, "description") || null,
      color: str(formData, "color") || null,
      glyph: str(formData, "glyph") || null,
      parseKeywords: parseKeywordsList(formData),
    },
  });
  revalidatePath("/settings");
}

// "deleting requires reassignment if in use" (E-06, GH #19). Renaming
// already updates everywhere for free (every ProjectFlag points at the
// same Flag row) — this is the other half: an optional reassignToId
// moves each in-use project onto a replacement flag before the old one
// is removed, instead of just silently dropping it off every project.
export async function deleteFlag(id: string, reassignToId?: string) {
  if (reassignToId) {
    const inUse = await prisma.projectFlag.findMany({ where: { flagId: id } });
    for (const pf of inUse) {
      await prisma.projectFlag.upsert({
        where: { projectId_flagId: { projectId: pf.projectId, flagId: reassignToId } },
        update: {},
        create: { projectId: pf.projectId, flagId: reassignToId },
      });
    }
  }
  await prisma.projectFlag.deleteMany({ where: { flagId: id } });
  await prisma.flag.delete({ where: { id } });
  revalidatePath("/settings");
}

// "trades [rename to bid packages] ... allow name input and div select"
// (S-batch #53) — a PackageTemplate's `code` isn't a form field, just an
// internal unique key derived from the name, since the owner's spec only
// asks for name + division on creation.
async function uniquePackageCode(base: string): Promise<string> {
  const slug =
    base
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "")
      .slice(0, 30) || "PKG";
  let code = slug;
  let n = 2;
  while (await prisma.packageTemplate.findUnique({ where: { code } })) {
    code = `${slug}-${n++}`;
  }
  return code;
}

export async function createPackageTemplate(name: string, division: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const code = await uniquePackageCode(trimmed);
  await prisma.packageTemplate.create({
    data: { code, name: trimmed, division: division || null, csiCodes: [], defaultFlags: [] },
  });
  revalidatePath("/settings");
}

export async function updatePackageTemplateMeta(id: string, name: string, division: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await prisma.packageTemplate.update({
    where: { id },
    data: { name: trimmed, division: division || null },
  });
  revalidatePath("/settings");
}

export async function deletePackageTemplate(id: string) {
  await prisma.packageTemplate.delete({ where: { id } });
  revalidatePath("/settings");
}

// Drag a CSI row from the left pane onto a package card on the right.
export async function addCsiToPackageTemplate(id: string, csiCode: string) {
  const tpl = await prisma.packageTemplate.findUnique({ where: { id } });
  if (!tpl || tpl.csiCodes.includes(csiCode)) return;
  await prisma.packageTemplate.update({
    where: { id },
    data: { csiCodes: { push: csiCode } },
  });
  revalidatePath("/settings");
}

export async function removeCsiFromPackageTemplate(id: string, csiCode: string) {
  const tpl = await prisma.packageTemplate.findUnique({ where: { id } });
  if (!tpl) return;
  await prisma.packageTemplate.update({
    where: { id },
    data: { csiCodes: tpl.csiCodes.filter((c) => c !== csiCode) },
  });
  revalidatePath("/settings");
}

// "arrow clicked adds as new package with same name and div" (S-batch
// #53) — the one-click shortcut from a CSI row straight into its own
// single-item package.
export async function quickAddPackageFromCsi(csiCode: string, title: string, division: string) {
  const code = await uniquePackageCode(title || csiCode);
  await prisma.packageTemplate.create({
    data: { code, name: title || csiCode, division: division || null, csiCodes: [csiCode], defaultFlags: [] },
  });
  revalidatePath("/settings");
}

export async function createTag(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  const type = (str(formData, "type") || "special") as TagType;
  await prisma.tag.create({ data: { name, type } });
  revalidatePath("/settings");
}

export async function deleteTag(id: string) {
  await prisma.projectTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/settings");
}

const TAG_TYPES: TagType[] = ["location", "requirement", "project_type", "contract_type", "special"];

// CSV import (S-batch #54) — two columns, name,type. Unknown/blank type
// falls back to "special" rather than rejecting the row, since a partial
// import (owner's own export re-uploaded, or a quick list without a type
// column) should still add the tags.
export async function importTagsCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const startIdx = lines[0]?.toLowerCase().startsWith("name") ? 1 : 0;

  for (const line of lines.slice(startIdx)) {
    const [rawName, rawType] = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (!rawName) continue;
    const type = TAG_TYPES.includes(rawType as TagType) ? (rawType as TagType) : "special";
    await prisma.tag.upsert({
      where: { name: rawName },
      update: { type },
      create: { name: rawName, type },
    });
  }
  revalidatePath("/settings");
}

// "add a spot for schedule styles in the settings" (S-batch #63) — kept
// minimal (name + description) as a placeholder; the owner hasn't
// specified what a style actually configures yet.
export async function createScheduleStyle(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  await prisma.scheduleStyle.create({ data: { name, description: str(formData, "description") || null } });
  revalidatePath("/settings");
}

export async function deleteScheduleStyle(id: string) {
  await prisma.scheduleStyle.delete({ where: { id } });
  revalidatePath("/settings");
}

// Global user management (#74) — admin-only. There was previously no
// in-app way to create a login at all once you needed something other
// than the fixed roster seed-users.ts writes; this replaces that with a
// real interface.
export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const role = str(formData, "role") as UserRole;
  const password = str(formData, "password");
  if (!name || !email || !role || !password) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, role, passwordHash } });
  revalidatePath("/settings");
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();

  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const role = str(formData, "role") as UserRole;
  const password = str(formData, "password");
  if (!name || !email || !role) return;

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  await prisma.user.update({
    where: { id },
    data: { name, email, role, ...(passwordHash ? { passwordHash } : {}) },
  });
  revalidatePath("/settings");
}

// Admin-editable CSI division names (#79 / S-notes v135a475) — a row here
// shadows the built-in name from src/lib/csi-codes.ts for that division
// code; deleting the override reverts to the shipped default.
export async function setCsiDivisionName(code: string, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) {
    await prisma.csiDivisionOverride.deleteMany({ where: { code } });
    revalidatePath("/settings");
    return;
  }
  await prisma.csiDivisionOverride.upsert({
    where: { code },
    create: { code, name: trimmed },
    update: { name: trimmed },
  });
  revalidatePath("/settings");
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.user.id === id) return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function uploadBidBondTemplate(formData: FormData) {
  const file = formData.get("template");
  if (!(file instanceof File) || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = await saveFile(`bid-bond-template/${file.name}`, buffer);

  await prisma.appFile.upsert({
    where: { key: "bid_bond_template" },
    update: { filename: file.name, storagePath, mimeType: file.type || null, uploadedAt: new Date() },
    create: { key: "bid_bond_template", filename: file.name, storagePath, mimeType: file.type || null },
  });

  revalidatePath("/settings");
}
