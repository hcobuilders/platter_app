import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Next.js 16 renamed middleware.ts -> proxy.ts (same runtime, same API,
// just the file/export name). Planroom stays public — it's the sub-facing
// magic-link surface, not gated behind GC user accounts.
const PUBLIC_PREFIXES = ["/login", "/planroom", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon$|apple-icon$).*)"],
};
