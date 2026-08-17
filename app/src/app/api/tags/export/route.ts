import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Tag CSV export (S-batch #54) — same two-column shape importTagsCsv reads
// back in, so export -> edit -> re-import round-trips cleanly.
export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  const rows = ["name,type", ...tags.map((t) => `${t.name},${t.type}`)];
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="tags.csv"',
    },
  });
}
