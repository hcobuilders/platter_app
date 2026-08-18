import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// TEMPORARY one-off endpoint to create a single admin login on request,
// gated by a secret only set on the production env var (BOOTSTRAP_SECRET) —
// removed again once used, not meant to stay in the codebase.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bootstrap-secret");
  if (!secret || secret !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email, name, role, password } = await req.json();
  if (!email || !name || !role || !password) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, role, passwordHash },
    update: { passwordHash, name, role },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
