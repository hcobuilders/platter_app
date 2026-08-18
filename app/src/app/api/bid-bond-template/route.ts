import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// Single-download limit (S-notes v135a475): once a project has downloaded
// the shared bid bond template, non-admin requests are refused — the
// overview page itself stops rendering the link at that point (see
// projects/[number]/page.tsx), so this 403 is a defense-in-depth backstop
// against someone hitting the URL directly, not the primary UX.
export async function GET(req: NextRequest) {
  const projectNumber = req.nextUrl.searchParams.get("project");

  const file = await prisma.appFile.findUnique({ where: { key: "bid_bond_template" } });
  if (!file) {
    return NextResponse.json({ error: "No bid bond template uploaded yet" }, { status: 404 });
  }

  if (projectNumber) {
    const project = await prisma.project.findUnique({ where: { number: projectNumber }, select: { bidBondDownloadedAt: true } });
    if (project?.bidBondDownloadedAt) {
      const session = await auth();
      if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "Already downloaded for this project" }, { status: 403 });
      }
    }
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(file.storagePath);
  } catch {
    return NextResponse.json({ error: "Stored file is missing" }, { status: 404 });
  }

  if (projectNumber) {
    await prisma.project.update({ where: { number: projectNumber }, data: { bidBondDownloadedAt: new Date() } }).catch(() => {});
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
