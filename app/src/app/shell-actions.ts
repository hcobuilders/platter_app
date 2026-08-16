"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getCommandRegistry() {
  const projects = await prisma.project.findMany({
    select: {
      number: true,
      name: true,
      bidPackages: { select: { code: true, name: true } },
    },
    orderBy: { number: "asc" },
  });
  return projects;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function createProject(formData: FormData) {
  const number = str(formData, "number");
  const name = str(formData, "name");
  if (!number || !name) return;

  await prisma.project.create({
    data: {
      number,
      name,
      owner: str(formData, "owner") || null,
      architectOfRecord: str(formData, "architectOfRecord") || null,
      deliveryMethod: str(formData, "deliveryMethod") || null,
      address: str(formData, "address") || null,
      status: "draft",
    },
  });

  revalidatePath("/");
  redirect(`/projects/${number}`);
}
