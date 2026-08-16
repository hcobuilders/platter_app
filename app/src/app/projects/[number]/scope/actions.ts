"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ScopeLineKind } from "@/generated/prisma/enums";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function optionalStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

function optionalFloat(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v === "" ? null : Number(v);
}

function optionalInt(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v === "" ? null : parseInt(v, 10);
}

export async function createScopeLine(projectNumber: string, bidPackageId: string, formData: FormData) {
  const lastSeq = await prisma.scopeLineItem.aggregate({
    where: { bidPackageId },
    _max: { seq: true },
  });

  await prisma.scopeLineItem.create({
    data: {
      bidPackageId,
      seq: (lastSeq._max.seq ?? 0) + 1,
      csiCode: optionalStr(formData, "csiCode"),
      description: str(formData, "description"),
      unit: optionalStr(formData, "unit"),
      qty: optionalFloat(formData, "qty"),
      kind: str(formData, "kind") as ScopeLineKind,
      isRequired: formData.get("isRequired") === "on",
      submittalRequired: formData.get("submittalRequired") === "on",
      longLeadWeeks: optionalInt(formData, "longLeadWeeks"),
    },
  });

  revalidatePath(`/projects/${projectNumber}/scope`);
}

export async function updateScopeLine(projectNumber: string, id: string, formData: FormData) {
  await prisma.scopeLineItem.update({
    where: { id },
    data: {
      csiCode: optionalStr(formData, "csiCode"),
      description: str(formData, "description"),
      unit: optionalStr(formData, "unit"),
      qty: optionalFloat(formData, "qty"),
      kind: str(formData, "kind") as ScopeLineKind,
      isRequired: formData.get("isRequired") === "on",
      submittalRequired: formData.get("submittalRequired") === "on",
      longLeadWeeks: optionalInt(formData, "longLeadWeeks"),
    },
  });

  revalidatePath(`/projects/${projectNumber}/scope`);
}

export async function deleteScopeLine(projectNumber: string, id: string) {
  await prisma.scopeLineItem.delete({ where: { id } });
  revalidatePath(`/projects/${projectNumber}/scope`);
}
