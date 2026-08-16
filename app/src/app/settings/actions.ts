"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { FlagType } from "@/generated/prisma/enums";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function createFlag(formData: FormData) {
  const label = str(formData, "label");
  const type = str(formData, "type") as FlagType;
  if (!label) return;
  await prisma.flag.create({
    data: { label, type, description: str(formData, "description") || null },
  });
  revalidatePath("/settings");
}

export async function deleteFlag(id: string) {
  await prisma.projectFlag.deleteMany({ where: { flagId: id } });
  await prisma.flag.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function createTrade(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  await prisma.trade.create({ data: { name, csiCode: str(formData, "csiCode") || null } });
  revalidatePath("/settings");
}

export async function deleteTrade(id: string) {
  await prisma.trade.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function createTag(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  await prisma.tag.create({ data: { name } });
  revalidatePath("/settings");
}

export async function deleteTag(id: string) {
  await prisma.projectTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/settings");
}
