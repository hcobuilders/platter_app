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

  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

// Single-field partial update, called directly from the client (not via a
// form submit) so ScopeWorksheetTable can autosave on blur/change without a
// visible per-row Save button, and so one field's edit can never
// accidentally blank out a sibling field the way a full-FormData replace
// would if that field wasn't part of the submission.
type ScopeLineFieldValues = {
  csiCode: string | null;
  description: string;
  unit: string | null;
  qty: number | null;
  kind: ScopeLineKind;
  isRequired: boolean;
  submittalRequired: boolean;
  longLeadWeeks: number | null;
};

export async function updateScopeLineField<K extends keyof ScopeLineFieldValues>(
  projectNumber: string,
  id: string,
  field: K,
  value: ScopeLineFieldValues[K]
) {
  await prisma.scopeLineItem.update({
    where: { id },
    data: { [field]: value },
  });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}

export async function deleteScopeLine(projectNumber: string, id: string) {
  await prisma.scopeLineItem.delete({ where: { id } });
  revalidatePath(`/projects/${projectNumber}/work-packages`);
}
