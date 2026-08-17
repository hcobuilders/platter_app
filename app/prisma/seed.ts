// Seeds the West Henry Logistics (26-085) project — D-44's adopted seed
// identity, reusing the same numbers already shown across the Batch 3-6
// wireframes (package 3A Concrete, the same four subs, the same budget
// table) so the interactive build starts from continuity with Step 1/2
// rather than inventing new example data.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Settings vocabularies (Batch 6) ──────────────────────────
  const flags = await Promise.all(
    [
      { label: "Bond required", type: "requirement" as const, description: "100% payment & performance bond required with bid" },
      { label: "Mandatory walk", type: "requirement" as const, description: "Site visit attendance required to bid" },
      { label: "Schedule required", type: "requirement" as const, description: "Preliminary/CPM schedule due with bid", parseKeywords: ["CPM schedule", "preliminary schedule", "Div 01 32 00"] },
      { label: "MBE/WBE goal", type: "informational" as const, description: "Participation goal noted for this package" },
      { label: "Long lead", type: "risk" as const, description: "Material lead time may affect schedule" },
    ].map((f) =>
      prisma.flag.upsert({
        where: { label: f.label },
        update: {},
        create: { ...f, parseKeywords: f.parseKeywords ?? [] },
      })
    )
  );
  const flagByLabel = Object.fromEntries(flags.map((f) => [f.label, f]));

  await Promise.all(
    [
      { name: "Concrete", csiCode: "03" },
      { name: "Structural Steel", csiCode: "05" },
      { name: "Drywall & Framing", csiCode: "09" },
      { name: "Electrical", csiCode: "26" },
    ].map((t) => prisma.trade.upsert({ where: { name: t.name }, update: {}, create: t }))
  );

  await Promise.all(
    ["Design-build", "Hard bid", "CM at-risk", "Public", "Negotiated", "Fast-track"].map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const templates = await Promise.all(
    [
      { code: "3A", name: "CIP Concrete", csiCodes: ["03 10 00", "03 20 00", "03 30 00"], defaultFlags: ["Schedule required"] },
      { code: "5A", name: "Structural Steel", csiCodes: ["05 12 00"], defaultFlags: [] },
      { code: "9A", name: "Drywall & Framing", csiCodes: ["09 21 00"], defaultFlags: [] },
    ].map((t) => prisma.packageTemplate.upsert({ where: { code: t.code }, update: {}, create: t }))
  );
  const templateByCode = Object.fromEntries(templates.map((t) => [t.code, t]));

  // ── Project ───────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { number: "26-085" },
    update: {
      bidBondRequired: true,
      gcContactName: "Jordan Lang",
      gcContactEmail: "jlang@hcobuilders.com",
      gcContactPhone: "(352) 555-0148",
    },
    create: {
      number: "26-085",
      name: "West Henry Logistics",
      address: "West Henry Logistics Park, Marion County, FL",
      owner: "West Henry Development Partners",
      architectOfRecord: "Halcyon Architecture Group",
      deliveryMethod: "CM at-risk",
      bondPct: 100,
      retainagePct: 10,
      bidBondRequired: true,
      pAndPMode: "in_base",
      gcContactName: "Jordan Lang",
      gcContactEmail: "jlang@hcobuilders.com",
      gcContactPhone: "(352) 555-0148",
      status: "leveling",
      externalIds: {},
      projectFlags: {
        create: [{ flagId: flagByLabel["Schedule required"].id }],
      },
    },
  });

  // ── Package 3A — CIP Concrete, fully modeled through scope/bid/budget ──
  const pkg3A = await prisma.bidPackage.upsert({
    where: { projectId_code: { projectId: project.id, code: "3A" } },
    update: { name: "CIP Concrete" },
    create: {
      projectId: project.id,
      code: "3A",
      name: "CIP Concrete",
      csiCodes: ["03 10 00", "03 20 00", "03 30 00"],
      status: "leveling",
      budgetAmount: 1_350_000_00n,
      requiresBond: true,
      templateId: templateByCode["3A"].id,
    },
  });

  // Two more packages under the same CSI division (03) — demonstrates
  // multiple packages nesting under one division summary in the budget
  // table, and package code/name shown as genuinely separate fields.
  const pkg3B = await prisma.bidPackage.upsert({
    where: { projectId_code: { projectId: project.id, code: "3B" } },
    update: { name: "Site Concrete" },
    create: {
      projectId: project.id,
      code: "3B",
      name: "Site Concrete",
      csiCodes: ["03 30 00"],
      status: "scoping",
      budgetAmount: 180_000_00n,
    },
  });
  const pkg3C = await prisma.bidPackage.upsert({
    where: { projectId_code: { projectId: project.id, code: "3C" } },
    update: { name: "Precast Concrete Structure" },
    create: {
      projectId: project.id,
      code: "3C",
      name: "Precast Concrete Structure",
      csiCodes: ["03 40 00"],
      status: "scoping",
      budgetAmount: 420_000_00n,
    },
  });

  const lineCip = await prisma.scopeLineItem.create({
    data: {
      bidPackageId: pkg3A.id,
      seq: 1,
      csiCode: "03 30 00",
      description: "Cast-in-place foundation walls",
      unit: "LS",
      kind: "inclusion",
    },
  });
  const lineSlab = await prisma.scopeLineItem.create({
    data: {
      bidPackageId: pkg3A.id,
      seq: 2,
      csiCode: "03 30 00",
      description: 'Slab on grade, 6" reinforced',
      unit: "LS",
      kind: "inclusion",
    },
  });
  const lineAlt = await prisma.scopeLineItem.create({
    data: {
      bidPackageId: pkg3A.id,
      seq: 3,
      csiCode: "03 35 00",
      description: "Alternate — polished slab finish",
      unit: "LS",
      kind: "alternate",
      isRequired: false,
    },
  });

  // ── Subs, invitations, bids (matches Batch 5's 5.1 comparison grid) ──
  const [bayline, marion, coastal, suncoast] = await Promise.all(
    [
      { name: "Bayline Concrete", trades: ["Concrete"], csiCodes: ["03 30 00"] },
      { name: "Marion Ready Mix & Forming", trades: ["Concrete"], csiCodes: ["03 30 00"] },
      { name: "Coastal Concrete Group", trades: ["Concrete"], csiCodes: ["03 30 00"] },
      { name: "Suncoast Structural", trades: ["Concrete"], csiCodes: ["03 30 00"] },
    ].map((s) => prisma.subcontractor.create({ data: s }))
  );

  const invBayline = await prisma.invitation.create({
    data: { bidPackageId: pkg3A.id, subcontractorId: bayline.id, token: "inv_bayline_3a", sentAt: new Date("2026-08-01"), openedAt: new Date("2026-08-01"), intent: "bidding" },
  });
  const invMarion = await prisma.invitation.create({
    data: { bidPackageId: pkg3A.id, subcontractorId: marion.id, token: "inv_marion_3a", sentAt: new Date("2026-08-01"), openedAt: new Date("2026-08-02"), intent: "bidding" },
  });
  await prisma.invitation.create({
    data: { bidPackageId: pkg3A.id, subcontractorId: coastal.id, token: "inv_coastal_3a", sentAt: new Date("2026-08-01"), intent: "no_bid" },
  });
  await prisma.invitation.create({
    data: { bidPackageId: pkg3A.id, subcontractorId: suncoast.id, token: "inv_suncoast_3a", sentAt: new Date("2026-08-01"), intent: "none" },
  });

  const bidBayline = await prisma.bid.create({
    data: {
      invitationId: invBayline.id,
      submittedAt: new Date("2026-08-08"),
      total: 481_400_00n,
      source: "portal",
      addendaAcked: ["1", "2"],
      bidLines: {
        create: [
          { scopeLineItemId: lineCip.id, amount: 187_400_00n, included: true, source: "sub" },
          { scopeLineItemId: lineSlab.id, amount: 294_000_00n, included: true, source: "sub" },
          { scopeLineItemId: lineAlt.id, amount: 31_500_00n, included: false, source: "sub" },
          // Sub-added, no matching scope_line_item_id — E-33's obligation.
          { amount: 12_400_00n, included: true, source: "sub", note: "Rebar supply upgraded to Grade 75 — submitted as an inclusion" },
        ],
      },
    },
  });

  await prisma.bid.create({
    data: {
      invitationId: invMarion.id,
      submittedAt: new Date("2026-08-09"),
      source: "xlsx_upload",
      addendaAcked: ["1"],
      bidLines: {
        create: [
          { scopeLineItemId: lineCip.id, amount: 191_000_00n, included: true, source: "parsed", confidence: 0.93 },
          // Slab on grade is a gap on purpose — Marion's upload had no matching row.
        ],
      },
    },
  });

  void bidBayline;

  // ── Budget (matches 5.2's main view, post-E-39 color fix) ──────
  // Division 03 carries three packages (3A/3B/3C) — the budget table
  // groups these under one "03 — Concrete" division summary row.
  await prisma.budgetLine.create({
    data: { projectId: project.id, bidPackageId: pkg3A.id, csiCode: "03", description: "3A — CIP Concrete", budget: 1_350_000_00n, current: 1_308_600_00n, buyoutExpected: 1_290_000_00n, awardedTo: "Bayline Concrete", tags: ["Buyout ready"] },
  });
  await prisma.budgetLine.create({
    data: { projectId: project.id, bidPackageId: pkg3B.id, csiCode: "03", description: "3B — Site Concrete", budget: 180_000_00n, current: 180_000_00n, tags: [] },
  });
  await prisma.budgetLine.create({
    data: { projectId: project.id, bidPackageId: pkg3C.id, csiCode: "03", description: "3C — Precast Concrete Structure", budget: 420_000_00n, current: 420_000_00n, tags: [] },
  });
  await prisma.budgetLine.create({
    data: { projectId: project.id, csiCode: "05", description: "5A — Structural Steel", budget: 1_980_000_00n, current: 1_940_000_00n, tags: ["Long lead"] },
  });
  await prisma.budgetLine.create({
    data: { projectId: project.id, csiCode: "09", description: "9A — Drywall & Framing", budget: 640_000_00n, current: 640_000_00n, tags: [] },
  });
  const budgetElectrical = await prisma.budgetLine.create({
    data: { projectId: project.id, csiCode: "26", description: "26A — Electrical", budget: 3_500_000_00n, current: 3_500_000_00n, tags: ["Schedule required"] },
  });
  void budgetElectrical;
  const budgetHvac = await prisma.budgetLine.create({
    data: { projectId: project.id, csiCode: "23", description: "23A — RTU package (HVAC)", budget: 840_000_00n, current: 840_000_00n, tags: [] },
  });
  const budgetRoof = await prisma.budgetLine.create({
    data: { projectId: project.id, csiCode: "07", description: "07A — TPO roof membrane", budget: 410_000_00n, current: 410_000_00n, tags: [] },
  });

  // ── Budget revisions (matches 5.3's history and delta compare) ──
  await prisma.budgetRevision.create({
    data: { projectId: project.id, revNo: 0, note: "Initial from packages", createdBy: "R. Harper", createdAt: new Date("2026-07-28"), snapshot: { "3A": 1_350_000_00, "5A": 1_980_000_00, "9A": 640_000_00, "26A": 3_500_000_00 } },
  });
  await prisma.budgetRevision.create({
    data: { projectId: project.id, revNo: 1, note: "Award-target budget", createdBy: "R. Harper", createdAt: new Date("2026-08-04"), snapshot: { "3A": 1_350_000_00, "5A": 1_980_000_00, "9A": 640_000_00, "26A": 3_420_000_00 } },
  });
  await prisma.budgetRevision.create({
    data: { projectId: project.id, revNo: 2, note: "Post-ITB baseline", createdBy: "R. Harper", createdAt: new Date("2026-08-09"), snapshot: { "3A": 1_350_000_00, "5A": 1_980_000_00, "9A": 640_000_00, "26A": 3_420_000_00 } },
  });
  await prisma.budgetRevision.create({
    data: { projectId: project.id, revNo: 3, note: "Post-3A leveling", createdBy: "R. Harper", createdAt: new Date(), snapshot: { "3A": 1_308_600_00, "5A": 1_940_000_00, "9A": 640_000_00, "26A": 3_500_000_00 } },
  });

  // ── Lifecycle cost scenarios (D-43, matches 5.4) ────────────────
  await prisma.lifecycleScenario.create({
    data: {
      budgetLineId: budgetHvac.id,
      label: "Current spec",
      isBaseline: true,
      initialCost: 840_000_00n,
      serviceLifeYrs: 15,
      replacementCost: 780_000_00n,
      annualMaintenanceCost: 18_000_00n,
      annualEnergyCost: 34_000_00n,
      energyEscalationRate: 5.0,
      salvageValuePct: 10,
      confidence: 0.88,
    },
  });
  await prisma.lifecycleScenario.create({
    data: {
      budgetLineId: budgetHvac.id,
      label: "High-efficiency unit",
      isBaseline: false,
      initialCost: 1_050_000_00n,
      serviceLifeYrs: 18,
      replacementCost: 920_000_00n,
      annualMaintenanceCost: 15_000_00n,
      annualEnergyCost: 22_000_00n,
      energyEscalationRate: 5.0,
      salvageValuePct: 15,
      confidence: 0.81,
    },
  });
  await prisma.lifecycleScenario.create({
    data: {
      budgetLineId: budgetRoof.id,
      label: "Current spec",
      isBaseline: true,
      initialCost: 410_000_00n,
      serviceLifeYrs: 20,
      replacementCost: 0n,
      annualMaintenanceCost: 6_500_00n,
      annualEnergyCost: 0n,
      energyEscalationRate: 0,
      salvageValuePct: 0,
      confidence: 0.74,
    },
  });

  console.log(`Seeded project ${project.number} — ${project.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
