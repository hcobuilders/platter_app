// Ten lightweight fabricated projects so the dashboard (cards/rows/filters/
// urgency states) has real volume to exercise, per owner's explicit request:
// "the data does not need to be accurate... generate any data or seed
// information so we can show multiple projects... multiple per state."
// Seven mirror the approved dashboard wireframe's own example cards
// (design/wireframes/batch-2-dashboard-shell.html) for continuity with what
// was actually approved; three more spread across TX/GA to cover "multiple
// states." NOT idempotent for transactional rows — same caveat as seed.ts,
// safe to run once per environment.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ProjectDateKind, ProjectStatus } from "../src/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DAY = 86_400_000;
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY);
}

type PkgSpec = { code: string; name: string; csiCode: string; budgetDollars: number; quoted?: boolean };
type DateSpec = { kind: ProjectDateKind; days: number; isMandatory?: boolean };

type ProjectSpec = {
  number: string;
  name: string;
  city: string;
  state: string;
  owner: string;
  architect: string;
  delivery: string;
  status: ProjectStatus;
  bondPct?: number;
  bidBondRequired?: boolean;
  dates: DateSpec[];
  packages: PkgSpec[];
};

const PROJECTS: ProjectSpec[] = [
  {
    number: "26-081",
    name: "Marion Transit Hub",
    city: "Ocala",
    state: "FL",
    owner: "Marion County Transit Authority",
    architect: "Halcyon Architecture Group",
    delivery: "CM at-risk",
    status: "bidding",
    bondPct: 100,
    bidBondRequired: true,
    dates: [
      { kind: "itb_out", days: -25 },
      { kind: "site_walk", days: -11 },
      { kind: "submission_due", days: 2 },
    ],
    packages: [
      { code: "2A", name: "Sitework & Utilities", csiCode: "02", budgetDollars: 3_800_000, quoted: true },
      { code: "3A", name: "Structural Concrete", csiCode: "03", budgetDollars: 5_200_000, quoted: true },
      { code: "5A", name: "Structural Steel", csiCode: "05", budgetDollars: 4_100_000, quoted: true },
      { code: "23A", name: "HVAC", csiCode: "23", budgetDollars: 2_900_000 },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 2_400_000 },
    ],
  },
  {
    number: "26-088",
    name: "Silver Springs Annex",
    city: "Silver Springs",
    state: "FL",
    owner: "Silver Springs Development Group",
    architect: "Bentley Group, Inc.",
    delivery: "Design-build",
    status: "draft",
    dates: [{ kind: "submission_due", days: 48 }],
    packages: [
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 2_600_000 },
      { code: "6A", name: "Rough Carpentry", csiCode: "06", budgetDollars: 1_400_000 },
      { code: "9A", name: "Finishes", csiCode: "09", budgetDollars: 2_100_000 },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 3_000_000 },
    ],
  },
  {
    number: "26-086",
    name: "Dunnellon Water Plant",
    city: "Dunnellon",
    state: "FL",
    owner: "City of Dunnellon Utilities",
    architect: "Halcyon Architecture Group",
    delivery: "Hard bid",
    status: "scoping",
    bondPct: 100,
    bidBondRequired: true,
    dates: [{ kind: "submission_due", days: 44 }],
    packages: [
      { code: "2A", name: "Sitework", csiCode: "02", budgetDollars: 2_900_000, quoted: true },
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 3_600_000, quoted: true },
      { code: "22A", name: "Process Piping", csiCode: "22", budgetDollars: 3_400_000 },
      { code: "26A", name: "Electrical & Controls", csiCode: "26", budgetDollars: 1_800_000 },
    ],
  },
  {
    number: "26-079",
    name: "Belleview Fire Station 3",
    city: "Belleview",
    state: "FL",
    owner: "City of Belleview",
    architect: "Bentley Group, Inc.",
    delivery: "CM at-risk",
    status: "leveling",
    bondPct: 100,
    bidBondRequired: true,
    dates: [{ kind: "submission_due", days: -3 }],
    packages: [
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 1_900_000, quoted: true },
      { code: "9A", name: "Finishes", csiCode: "09", budgetDollars: 1_500_000, quoted: true },
      { code: "23A", name: "HVAC", csiCode: "23", budgetDollars: 2_720_000 },
    ],
  },
  {
    number: "26-072",
    name: "Ocala Municipal Garage",
    city: "Ocala",
    state: "FL",
    owner: "City of Ocala Fleet Services",
    architect: "Halcyon Architecture Group",
    delivery: "Hard bid",
    status: "submitted",
    bondPct: 100,
    bidBondRequired: true,
    dates: [{ kind: "award_target", days: 14 }],
    packages: [
      { code: "5A", name: "Structural Steel", csiCode: "05", budgetDollars: 2_100_000, quoted: true },
      { code: "9A", name: "Finishes", csiCode: "09", budgetDollars: 1_280_000, quoted: true },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 1_500_000, quoted: true },
    ],
  },
  {
    number: "25-140",
    name: "Citra Elementary Addition",
    city: "Citra",
    state: "FL",
    owner: "Marion County Public Schools",
    architect: "Bentley Group, Inc.",
    delivery: "CM at-risk",
    status: "awarded",
    bondPct: 100,
    bidBondRequired: true,
    dates: [{ kind: "award_target", days: -66 }],
    packages: [
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 3_400_000, quoted: true },
      { code: "6A", name: "Casework", csiCode: "06", budgetDollars: 1_900_000, quoted: true },
      { code: "9A", name: "Finishes", csiCode: "09", budgetDollars: 3_650_000, quoted: true },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 3_100_000, quoted: true },
    ],
  },
  {
    number: "25-131",
    name: "Lake Weir Community Center",
    city: "Ocklawaha",
    state: "FL",
    owner: "Marion County Parks & Recreation",
    architect: "Halcyon Architecture Group",
    delivery: "Hard bid",
    status: "lost",
    bondPct: 100,
    bidBondRequired: true,
    dates: [{ kind: "award_target", days: -80 }],
    packages: [
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 2_240_000, quoted: true },
      { code: "9A", name: "Finishes", csiCode: "09", budgetDollars: 2_400_000, quoted: true },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 2_800_000, quoted: true },
    ],
  },
  {
    number: "TX-24-019",
    name: "Austin Transit Maintenance Facility",
    city: "Austin",
    state: "TX",
    owner: "Capital Metropolitan Transportation Authority",
    architect: "Bentley Group, Inc.",
    delivery: "CM at-risk",
    status: "bidding",
    bondPct: 100,
    bidBondRequired: true,
    dates: [
      { kind: "site_walk", days: -6, isMandatory: true },
      { kind: "submission_due", days: 21 },
    ],
    packages: [
      { code: "2A", name: "Sitework & Utilities", csiCode: "02", budgetDollars: 5_100_000, quoted: true },
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 6_400_000, quoted: true },
      { code: "5A", name: "Structural Steel", csiCode: "05", budgetDollars: 4_800_000 },
      { code: "23A", name: "HVAC", csiCode: "23", budgetDollars: 3_200_000 },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 2_500_000 },
    ],
  },
  {
    number: "GA-25-006",
    name: "Savannah Riverfront Pavilion",
    city: "Savannah",
    state: "GA",
    owner: "City of Savannah Parks Department",
    architect: "Halcyon Architecture Group",
    delivery: "Design-build",
    status: "draft",
    dates: [{ kind: "submission_due", days: 60 }],
    packages: [
      { code: "3A", name: "Concrete", csiCode: "03", budgetDollars: 900_000 },
      { code: "6A", name: "Wood Structure", csiCode: "06", budgetDollars: 1_400_000 },
      { code: "9A", name: "Finishes", csiCode: "09", budgetDollars: 900_000 },
    ],
  },
  {
    number: "GA-25-014",
    name: "Macon Regional Airport Hangar",
    city: "Macon",
    state: "GA",
    owner: "Macon-Bibb County Airport Authority",
    architect: "Bentley Group, Inc.",
    delivery: "Hard bid",
    status: "leveling",
    bondPct: 100,
    bidBondRequired: true,
    dates: [{ kind: "submission_due", days: -1 }],
    packages: [
      { code: "2A", name: "Sitework", csiCode: "02", budgetDollars: 2_800_000, quoted: true },
      { code: "5A", name: "Structural Steel", csiCode: "05", budgetDollars: 6_900_000, quoted: true },
      { code: "8A", name: "Doors, Frames & Hardware", csiCode: "08", budgetDollars: 1_600_000 },
      { code: "26A", name: "Electrical", csiCode: "26", budgetDollars: 4_300_000 },
    ],
  },
];

async function main() {
  let subCounter = 0;
  for (const spec of PROJECTS) {
    const project = await prisma.project.upsert({
      where: { number: spec.number },
      update: {},
      create: {
        number: spec.number,
        name: spec.name,
        address: `${spec.city}, ${spec.state}`,
        owner: spec.owner,
        architectOfRecord: spec.architect,
        deliveryMethod: spec.delivery,
        bondPct: spec.bondPct ?? null,
        bidBondRequired: spec.bidBondRequired ?? false,
        status: spec.status,
        externalIds: {},
        dates: {
          create: spec.dates.map((d) => ({ kind: d.kind, at: daysFromNow(d.days), isMandatory: d.isMandatory ?? false })),
        },
      },
    });

    for (const pkgSpec of spec.packages) {
      const pkg = await prisma.bidPackage.upsert({
        where: { projectId_code: { projectId: project.id, code: pkgSpec.code } },
        update: {},
        create: {
          projectId: project.id,
          code: pkgSpec.code,
          name: pkgSpec.name,
          csiCodes: [pkgSpec.csiCode],
          status: spec.status === "draft" ? "draft" : "bidding",
          budgetAmount: BigInt(pkgSpec.budgetDollars * 100),
        },
      });

      await prisma.budgetLine.create({
        data: {
          projectId: project.id,
          bidPackageId: pkg.id,
          csiCode: pkgSpec.csiCode,
          description: `${pkg.code} — ${pkg.name}`,
          budget: BigInt(pkgSpec.budgetDollars * 100),
          current: BigInt(pkgSpec.budgetDollars * 100),
        },
      });

      if (pkgSpec.quoted) {
        subCounter++;
        const sub = await prisma.subcontractor.create({
          data: { name: `${pkg.name} Specialists ${subCounter}`, trades: [pkg.name] },
        });
        const invitation = await prisma.invitation.create({
          data: {
            bidPackageId: pkg.id,
            subcontractorId: sub.id,
            token: `inv_fab_${spec.number.toLowerCase().replace(/[^a-z0-9]/g, "")}_${pkg.code.toLowerCase()}`,
            sentAt: daysFromNow(-10),
            openedAt: daysFromNow(-9),
            intent: "bidding",
          },
        });
        await prisma.bid.create({
          data: {
            invitationId: invitation.id,
            submittedAt: daysFromNow(-2),
            total: BigInt(Math.round(pkgSpec.budgetDollars * 0.97 * 100)),
            source: "portal",
          },
        });
      }
    }

    console.log(`Seeded ${project.number} — ${project.name} (${spec.packages.length} packages)`);
  }

  console.log(`Done — ${PROJECTS.length} fabricated projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
