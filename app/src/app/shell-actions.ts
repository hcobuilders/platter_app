"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

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

  const project = await prisma.project.create({
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

  // "apply template should only be for manual projects" (S-batch #72) —
  // this whole form only exists for manual creation today (there's no
  // AI-parse-from-documents flow built yet), so the template dropdown
  // just needs to be optional here.
  const templateId = str(formData, "templateId");
  if (templateId) await applyProjectTemplate(project.id, templateId);

  revalidatePath("/");
  redirect(`/projects/${number}`);
}

// Recreates a saved template's bid packages + bidder invitations under a
// freshly created project. Skips any bidder whose subcontractor record was
// deleted since the template was saved (subcontractorId no longer resolves).
async function applyProjectTemplate(projectId: string, templateId: string) {
  const template = await prisma.projectTemplate.findUnique({
    where: { id: templateId },
    include: { packages: true },
  });
  if (!template) return;

  for (const pkg of template.packages) {
    const bidPackage = await prisma.bidPackage.create({
      data: { projectId, code: pkg.code, name: pkg.name, csiCodes: pkg.csiCodes },
    });

    const bidders = Array.isArray(pkg.bidders) ? (pkg.bidders as { subcontractorId: string | null; name: string }[]) : [];
    for (const bidder of bidders) {
      if (!bidder.subcontractorId) continue;
      const sub = await prisma.subcontractor.findUnique({ where: { id: bidder.subcontractorId } });
      if (!sub) continue;
      await prisma.invitation.create({
        data: { bidPackageId: bidPackage.id, subcontractorId: bidder.subcontractorId, token: randomBytes(16).toString("hex") },
      });
    }
  }
}
