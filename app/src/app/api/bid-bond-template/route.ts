import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = await prisma.appFile.findUnique({ where: { key: "bid_bond_template" } });
  if (!file) {
    return NextResponse.json({ error: "No bid bond template uploaded yet" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(file.storagePath);
  } catch {
    return NextResponse.json({ error: "Stored file is missing" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
