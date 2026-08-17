// One-off: the 10 fabricated projects (S-25) got bid packages but no scope
// line items, leaving nothing to actually manipulate in the scope worksheet
// or bid tab. Fills every package that still has zero lines with a handful
// of generically plausible lines keyed off its CSI division. Idempotent —
// skips any package that already has scope lines, so safe to rerun.
import "dotenv/config";
import { prisma } from "../src/lib/db";

type Template = { description: string; unit: string; qty: number; kind: "inclusion" | "alternate"; submittalRequired?: boolean; longLeadWeeks?: number };

const BY_DIVISION: Record<string, Template[]> = {
  "02": [
    { description: "Mobilization & site protection", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Site utilities rough-in", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Erosion & sediment control", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Additional site lighting package", unit: "LS", qty: 1, kind: "alternate" },
  ],
  "03": [
    { description: "Footings & foundations", unit: "CY", qty: 220, kind: "inclusion" },
    { description: "Slab on grade, 6\" reinforced", unit: "SF", qty: 12000, kind: "inclusion" },
    { description: "Foundation walls", unit: "LF", qty: 480, kind: "inclusion" },
    { description: "Decorative/exposed concrete finish", unit: "SF", qty: 1800, kind: "alternate" },
  ],
  "05": [
    { description: "Structural steel erection", unit: "TON", qty: 85, kind: "inclusion", submittalRequired: true, longLeadWeeks: 8 },
    { description: "Miscellaneous metals & railings", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Galvanized finish upgrade", unit: "LS", qty: 1, kind: "alternate" },
  ],
  "06": [
    { description: "Rough carpentry framing", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Finish carpentry & trim", unit: "LF", qty: 640, kind: "inclusion" },
    { description: "Casework installation", unit: "LF", qty: 180, kind: "inclusion", submittalRequired: true },
  ],
  "08": [
    { description: "Hollow metal doors & frames", unit: "EA", qty: 24, kind: "inclusion", submittalRequired: true },
    { description: "Door hardware", unit: "EA", qty: 24, kind: "inclusion", submittalRequired: true },
    { description: "Storefront glazing", unit: "SF", qty: 620, kind: "inclusion", submittalRequired: true },
  ],
  "09": [
    { description: "Drywall & metal framing", unit: "SF", qty: 18500, kind: "inclusion" },
    { description: "Paint — interior", unit: "SF", qty: 22000, kind: "inclusion" },
    { description: "Flooring — VCT/carpet tile", unit: "SF", qty: 14000, kind: "inclusion" },
    { description: "Upgrade to LVT flooring throughout", unit: "SF", qty: 14000, kind: "alternate" },
  ],
  "22": [
    { description: "Plumbing rough-in", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Fixtures & trim", unit: "EA", qty: 32, kind: "inclusion", submittalRequired: true },
    { description: "Process piping", unit: "LF", qty: 940, kind: "inclusion", submittalRequired: true, longLeadWeeks: 4 },
  ],
  "23": [
    { description: "RTU package install", unit: "EA", qty: 6, kind: "inclusion", submittalRequired: true, longLeadWeeks: 10 },
    { description: "Ductwork & distribution", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Controls & startup", unit: "LS", qty: 1, kind: "inclusion", submittalRequired: true },
  ],
  "26": [
    { description: "Electrical rough-in", unit: "LS", qty: 1, kind: "inclusion" },
    { description: "Panel & gear", unit: "EA", qty: 4, kind: "inclusion", submittalRequired: true, longLeadWeeks: 6 },
    { description: "Lighting fixtures", unit: "LS", qty: 1, kind: "inclusion", submittalRequired: true },
    { description: "LED upgrade package", unit: "LS", qty: 1, kind: "alternate" },
  ],
};

function templatesFor(csiCodes: string[]): Template[] {
  const division = (csiCodes[0] ?? "09").slice(0, 2);
  return BY_DIVISION[division] ?? BY_DIVISION["09"];
}

async function main() {
  const packages = await prisma.bidPackage.findMany({
    include: { _count: { select: { scopeLineItems: true } } },
  });

  let filled = 0;
  for (const pkg of packages) {
    if (pkg._count.scopeLineItems > 0) continue;
    const templates = templatesFor(pkg.csiCodes);
    let seq = 1;
    for (const t of templates) {
      await prisma.scopeLineItem.create({
        data: {
          bidPackageId: pkg.id,
          seq: seq++,
          csiCode: pkg.csiCodes[0] ?? null,
          description: t.description,
          unit: t.unit,
          qty: t.qty,
          kind: t.kind,
          isRequired: t.kind === "inclusion",
          submittalRequired: t.submittalRequired ?? false,
          longLeadWeeks: t.longLeadWeeks ?? null,
        },
      });
    }
    filled++;
    console.log(`Filled ${pkg.code} — ${pkg.name} (${templates.length} lines)`);
  }
  console.log(`Done — ${filled} package(s) filled.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
