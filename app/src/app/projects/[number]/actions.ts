"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
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
