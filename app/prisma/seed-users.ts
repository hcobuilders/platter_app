// One-off: creates one test user per permission class so role-based access
// can actually be exercised. Credentials are written ONLY to a file outside
// the repo/app (passed via CREDENTIALS_OUT_PATH) — never committed, never
// served by the app itself, per the owner's explicit instruction.
import "dotenv/config";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { writeFileSync } from "fs";

const ROLES = [
  { role: "admin", name: "Ada Admin", email: "ada.admin@platter.test" },
  { role: "estimator", name: "Ellis Estimator", email: "ellis.estimator@platter.test" },
  { role: "manager", name: "Mia Manager", email: "mia.manager@platter.test" },
  { role: "director", name: "Dana Director", email: "dana.director@platter.test" },
  { role: "owner", name: "Owen Owner", email: "owen.owner@platter.test" },
  { role: "field", name: "Finn Field", email: "finn.field@platter.test" },
  { role: "project_manager", name: "Priya PM", email: "priya.pm@platter.test" },
  { role: "superintendent", name: "Sam Superintendent", email: "sam.super@platter.test" },
  { role: "preconstruction_viewer", name: "Vic Viewer", email: "vic.viewer@platter.test" },
] as const;

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

// Lets a second run (e.g. against production) reuse the exact passwords
// already generated locally, instead of minting new ones that would only
// ever exist in that environment's logs — the one credentials file handed
// to the owner stays valid everywhere.
const fixedPasswords: Record<string, string> = process.env.FIXED_PASSWORDS_JSON
  ? JSON.parse(process.env.FIXED_PASSWORDS_JSON)
  : {};

async function main() {
  const rows: { role: string; name: string; email: string; password: string }[] = [];

  for (const u of ROLES) {
    const password = fixedPasswords[u.email] ?? generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
      update: { passwordHash, role: u.role, name: u.name },
    });
    rows.push({ role: u.role, name: u.name, email: u.email, password });
    console.log(`Seeded ${u.role} — ${u.email}`);
  }

  const outPath = process.env.CREDENTIALS_OUT_PATH;
  const reusedFixed = Object.keys(fixedPasswords).length > 0;

  if (!outPath) {
    if (reusedFixed) {
      // Reused already-known passwords (e.g. this run is against
      // production) — nothing new was generated, so there's nothing that
      // needs writing out here.
      console.log("No new passwords generated (FIXED_PASSWORDS_JSON supplied) — skipping credentials file.");
      return;
    }
    console.error("CREDENTIALS_OUT_PATH not set — refusing to print credentials to stdout/logs.");
    process.exit(1);
  }

  const md = [
    "# Platter test user credentials",
    "",
    `Generated ${new Date().toISOString()}. Passwords are reset every time this script runs — treat this file as disposable, delete it once you're done testing.`,
    "",
    "| Role | Name | Email | Password |",
    "|---|---|---|---|",
    ...rows.map((r) => `| ${r.role} | ${r.name} | ${r.email} | \`${r.password}\` |`),
  ].join("\n");

  writeFileSync(outPath, md, "utf8");
  console.log(`Credentials written to ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
