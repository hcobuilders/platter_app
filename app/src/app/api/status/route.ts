import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Backs the account dropdown's "Server status" / "Uptime" rows (S-batch
// #58). Auth-gated like everything else via proxy.ts — no new public
// surface. Uptime is the running server process's, which on Railway means
// "since the last deploy," a real and meaningful number here.
export async function GET() {
  const startedAt = Date.now() - process.uptime() * 1000;

  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    ok: dbOk,
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt,
  });
}
