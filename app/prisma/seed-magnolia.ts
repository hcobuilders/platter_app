// Seeds "Magnolia Building Renovation" (599-444) as a second, richer
// example project alongside West Henry Logistics — built from a real
// (lightweight) set of drawings/specs the owner parsed into
// docs/seed-spec + synthetic subcontractor bid PDFs, replacing the
// invented example with one grounded in real documents. NOT idempotent
// for transactional rows (packages/scope/subs/bids) — same caveat as
// seed.ts, safe to run once per environment.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ScopeDef = {
  seq: number;
  csiCode: string;
  description: string;
  unit: string;
  kind: "inclusion" | "exclusion" | "alternate" | "allowance" | "unit_price" | "clarification" | "va_option";
  isRequired: boolean;
  submittalRequired: boolean;
  longLeadWeeks?: number;
};

async function main() {
  // ── Flags (project-wide, from the CFX Invitation to Bid) ──────────
  const flagDefs = [
    { label: "Proposal guaranty required", type: "requirement" as const, description: "Prime bid must include a proposal guaranty of at least 5 percent of total bid.", parseKeywords: ["proposal guaranty", "bid security", "five percent", "5%"] },
    { label: "Public construction bond required", type: "requirement" as const, description: "Successful prime contractor must furnish a bond equal to the contract amount.", parseKeywords: ["public construction bond", "contract bond", "100%", "amount of the Contract"] },
    { label: "Mandatory prebid meeting", type: "requirement" as const, description: "Mandatory meeting scheduled August 18, 2026 at 9:00 a.m.; notice lists the CFX Administration Building and a Teams option.", parseKeywords: ["mandatory prebid", "site visit", "August 18 2026"] },
    { label: "Florida GC license", type: "requirement" as const, description: "Prime bidder must submit a current Florida General Contractor license; licensed subcontractors are required where applicable.", parseKeywords: ["Florida General Contractor", "license", "licensed subcontractor"] },
    { label: "Prequalification certificate", type: "requirement" as const, description: "Copy of the bidder's prequalification certificate is required with the bid.", parseKeywords: ["prequalification certificate", "rejection"] },
    { label: "Electronic bid deadline", type: "requirement" as const, description: "Bid due through CFX eProcurement September 4, 2026 at 9:00 a.m. Orlando time; no hardcopies accepted.", parseKeywords: ["electronic bid", "OpenGov", "September 4 2026", "9:00 a.m."] },
    { label: "SBE participation objective", type: "requirement" as const, description: "CFX states a 15 percent Small Business Enterprise participation objective.", parseKeywords: ["SBE", "small business", "15%"] },
    { label: "CPM schedule and XER", type: "requirement" as const, description: "For the 280-calendar-day contract, provide Primavera P6 baseline/updates and electronic XER files in accordance with the scheduling specification.", parseKeywords: ["CPM", "Primavera P6", "XER", "baseline schedule"] },
    { label: "280-calendar-day duration", type: "informational" as const, description: "Contract duration stated in the Invitation to Bid.", parseKeywords: ["contract time", "280 calendar days"] },
    { label: "Bid held 90 days", type: "informational" as const, description: "Bid remains open for CFX acceptance for 90 calendar days after opening.", parseKeywords: ["remain open", "90 calendar days"] },
    { label: "Conflicting invitation scope", type: "risk" as const, description: "Invitation title is Magnolia Building Renovation, but its summary describes unrelated wrong-way-driving work at 46 interchanges. Confirm by addendum before bid.", parseKeywords: ["wrong-way driving", "WWD", "46 interchanges"] },
    { label: "Hazardous-material coordination", type: "risk" as const, description: "Technical documents include Section 02 82 14 and demolition notes; survey limits and abatement responsibility require confirmation.", parseKeywords: ["hazardous materials", "asbestos", "abatement"] },
  ];
  const flags = await Promise.all(
    flagDefs.map((f) => prisma.flag.upsert({ where: { label: f.label }, update: {}, create: f }))
  );

  // ── Trades ──────────────────────────────────────────────────────
  const tradeDefs = [
    { name: "Selective Demolition and Framing", csiCode: "02" },
    { name: "Architectural Casework", csiCode: "06" },
    { name: "Doors, Frames, Hardware and Glazing", csiCode: "08" },
    { name: "Interior Finishes", csiCode: "09" },
    { name: "Plumbing and HVAC", csiCode: "22" },
    { name: "Electrical and Low Voltage", csiCode: "26" },
  ];
  await Promise.all(tradeDefs.map((t) => prisma.trade.upsert({ where: { name: t.name }, update: {}, create: t } )));

  // ── Tags ────────────────────────────────────────────────────────
  const tagNames = ["Hard bid", "Public owner", "Interior renovation", "Occupied facility", "Orlando", "Mandatory prebid", "SBE objective", "Bonded", "280 calendar days", "Lump sum"];
  const tags = await Promise.all(tagNames.map((name) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })));

  // ── Project ─────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { number: "599-444" },
    update: {
      bidBondRequired: true,
      gcContactName: "Jordan Lang",
      gcContactEmail: "jlang@hcobuilders.com",
      gcContactPhone: "(352) 555-0148",
    },
    create: {
      number: "599-444",
      name: "Magnolia Building Renovation",
      address: "525 S. Magnolia Avenue, Orlando, FL 32801",
      owner: "Central Florida Expressway Authority (CFX)",
      architectOfRecord: "Bentley Group, Inc. (Fernanda Alves Silva, RA)",
      deliveryMethod: "Hard bid",
      bondPct: 100,
      bidBondRequired: true,
      pAndPMode: "in_base",
      gcContactName: "Jordan Lang",
      gcContactEmail: "jlang@hcobuilders.com",
      gcContactPhone: "(352) 555-0148",
      status: "bidding",
      externalIds: {},
      projectFlags: { create: flags.map((f) => ({ flagId: f.id })) },
      projectTags: { create: tags.map((t) => ({ tagId: t.id })) },
    },
  });

  // ── Bid packages + scope line items ────────────────────────────
  async function createPackage(
    code: string,
    name: string,
    csiCodes: string[],
    scopeDefs: ScopeDef[]
  ) {
    const pkg = await prisma.bidPackage.upsert({
      where: { projectId_code: { projectId: project.id, code } },
      update: { name },
      create: { projectId: project.id, code, name, csiCodes, status: "bidding", requiresBond: false, longLead: scopeDefs.some((d) => (d.longLeadWeeks ?? 0) >= 8) },
    });
    const lines: Record<number, { id: string }> = {};
    for (const d of scopeDefs) {
      lines[d.seq] = await prisma.scopeLineItem.create({
        data: {
          bidPackageId: pkg.id,
          seq: d.seq,
          csiCode: d.csiCode,
          description: d.description,
          unit: d.unit,
          kind: d.kind,
          isRequired: d.isRequired,
          submittalRequired: d.submittalRequired,
          longLeadWeeks: d.longLeadWeeks ?? null,
        },
      });
    }
    return { pkg, lines };
  }

  const pkg2A = await createPackage("2A", "Selective Demolition and Framing", ["02 41 00", "02 41 20", "02 82 14", "06 10 00", "09 21 16"], [
    { seq: 1, csiCode: "02 41 00", description: "Selective interior demolition, removals, protection, hauling and lawful disposal per demolition plans", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: false },
    { seq: 2, csiCode: "02 41 20", description: "Cutting, fitting and patching required for new architectural and MEP work", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: false },
    { seq: 3, csiCode: "09 21 16", description: "Metal-stud gypsum-board partitions, furring, backing and indicated acoustical insulation", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 3 },
    { seq: 4, csiCode: "06 10 00", description: "Wood blocking and rough carpentry for wall-mounted items, openings and millwork", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 2 },
    { seq: 5, csiCode: "02 82 14", description: "Hazardous-material abatement beyond expressly identified work", unit: "LS", kind: "exclusion", isRequired: false, submittalRequired: false },
    { seq: 6, csiCode: "09 21 16", description: "Alternate price for abuse-resistant gypsum board at public corridor walls", unit: "LS", kind: "va_option", isRequired: false, submittalRequired: true, longLeadWeeks: 4 },
  ]);

  const pkg6A = await createPackage("6A", "Architectural Casework and Countertops", ["06 41 00", "12 36 00"], [
    { seq: 1, csiCode: "06 41 00", description: "Custom architectural wood base and wall casework shown on interior elevations and millwork details", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 10 },
    { seq: 2, csiCode: "12 36 00", description: "Countertops, splashes, cutouts, supports and field joints associated with casework", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
    { seq: 3, csiCode: "06 41 00", description: "Cabinet hardware, finished ends, fillers, scribes and trim", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
    { seq: 4, csiCode: "06 41 00", description: "Field measurement, coordinated shop drawings and finish samples", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 2 },
    { seq: 5, csiCode: "06 41 00", description: "Relocation of owner-furnished existing furniture or freestanding millwork", unit: "LS", kind: "exclusion", isRequired: false, submittalRequired: false },
    { seq: 6, csiCode: "12 36 00", description: "Alternate solid-surface selection from an equal manufacturer", unit: "LS", kind: "va_option", isRequired: false, submittalRequired: true, longLeadWeeks: 8 },
  ]);

  const pkg8A = await createPackage("8A", "Doors, Frames, Hardware and Glazing", ["08 11 13", "08 14 16", "08 43 13", "08 71 00", "08 80 00", "08 87 23"], [
    { seq: 1, csiCode: "08 11 13", description: "Hollow-metal doors and frames, anchors, reinforcement and factory preparation", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
    { seq: 2, csiCode: "08 14 16", description: "Flush wood doors, factory machining and specified finishes", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 10 },
    { seq: 3, csiCode: "08 71 00", description: "Complete door hardware sets, keying coordination and installation", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 12 },
    { seq: 4, csiCode: "08 43 13", description: "Interior aluminum-framed storefront assemblies", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 10 },
    { seq: 5, csiCode: "08 80 00", description: "Glass and glazing for doors, sidelights and storefront", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
    { seq: 6, csiCode: "08 87 23", description: "Safety and security film at glazing indicated by finish tags", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 6 },
    { seq: 7, csiCode: "08 71 00", description: "Access-control devices, cabling and head-end programming", unit: "LS", kind: "exclusion", isRequired: false, submittalRequired: false },
  ]);

  const pkg9A = await createPackage(
    "9A",
    "Interior Finishes and Specialties",
    ["09 05 61", "09 30 00", "09 51 00", "09 65 00", "09 68 13", "09 72 00", "09 91 23", "10 14 23", "10 21 13.19", "10 26 00", "10 28 00", "10 44 00", "10 56 13", "12 24 13"],
    [
      { seq: 1, csiCode: "09 05 61", description: "Substrate testing, moisture mitigation allowance and floor preparation", unit: "allowance", kind: "allowance", isRequired: true, submittalRequired: true, longLeadWeeks: 3 },
      { seq: 2, csiCode: "09 30 00", description: "Floor and wall tile, setting materials, grout, trims and sealants", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
      { seq: 3, csiCode: "09 51 00", description: "Acoustical ceiling grid and tile, including selective lobby noise-mitigation replacement", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 6 },
      { seq: 4, csiCode: "09 65 00", description: "Resilient flooring and wall base", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 6 },
      { seq: 5, csiCode: "09 68 13", description: "Carpet tile and accessories", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 6 },
      { seq: 6, csiCode: "09 72 00", description: "Wall coverings and substrate preparation", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
      { seq: 7, csiCode: "09 91 23", description: "Interior painting and touch-up of affected adjacent surfaces", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 3 },
      { seq: 8, csiCode: "10 21 13.19", description: "Plastic toilet compartments", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 10 },
      { seq: 9, csiCode: "10 14 23", description: "Panel signage and code-required room identification", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
      { seq: 10, csiCode: "10 28 00", description: "Toilet accessories, wall/door protection, extinguishers/cabinets, shelving and window shades", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
      { seq: 11, csiCode: "09 65 00", description: "Unit price for additional resilient-floor moisture mitigation beyond allowance", unit: "SF", kind: "unit_price", isRequired: false, submittalRequired: true },
    ]
  );

  const pkg22A = await createPackage(
    "22A",
    "Plumbing and HVAC",
    ["22 05 23", "22 05 29", "22 05 53", "22 07 00", "22 11 16", "22 13 16", "22 13 19", "22 40 00", "23 05 00", "23 05 17", "23 05 53", "23 05 93", "23 07 13", "23 31 13", "23 33 00", "23 36 00", "23 37 13", "23 37 23"],
    [
      { seq: 1, csiCode: "22 11 16", description: "Domestic-water piping modifications, valves, supports, insulation and identification", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 5 },
      { seq: 2, csiCode: "22 13 16", description: "Sanitary waste and vent piping modifications and specialties", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 5 },
      { seq: 3, csiCode: "22 40 00", description: "Plumbing fixtures, carriers, trim, connections and testing", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 10 },
      { seq: 4, csiCode: "23 31 13", description: "Ductwork modifications, insulation, accessories and supports", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 6 },
      { seq: 5, csiCode: "23 36 00", description: "Air-terminal units, diffusers, registers, grilles and gravity ventilators", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 16 },
      { seq: 6, csiCode: "23 05 93", description: "Complete HVAC testing, adjusting and balancing", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 4 },
      { seq: 7, csiCode: "23 05 00", description: "Controls work specifically shown on AM-701, including coordination with existing controls", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 12 },
      { seq: 8, csiCode: "23 31 13", description: "Unit price for after-hours tie-in crew when directed by Owner", unit: "HR", kind: "unit_price", isRequired: false, submittalRequired: false },
    ]
  );

  const pkg26A = await createPackage(
    "26A",
    "Electrical and Low Voltage",
    ["26 05 00", "26 05 01", "26 05 19", "26 05 26", "26 05 29", "26 05 33", "26 05 53", "26 09 23", "26 27 26", "26 28 17", "26 43 13", "26 51 13", "27 10 00", "28 05 14", "28 31 11"],
    [
      { seq: 1, csiCode: "26 05 33", description: "Branch raceways, boxes, conductors, grounding, supports and identification", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 4 },
      { seq: 2, csiCode: "26 27 26", description: "Wiring devices, device plates and connections to indicated equipment", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 5 },
      { seq: 3, csiCode: "26 51 13", description: "Lighting fixtures, lamps/drivers, supports and fixture whips", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 14 },
      { seq: 4, csiCode: "26 09 23", description: "Lighting controls, sensors, low-voltage control wiring and functional testing", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 10 },
      { seq: 5, csiCode: "27 10 00", description: "Structured-cabling pathways, cable, terminations, testing and labeling", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 8 },
      { seq: 6, csiCode: "28 05 14", description: "Access-control system devices, interface, cabling and programming", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 12 },
      { seq: 7, csiCode: "28 31 11", description: "Fire-alarm demolition, devices, circuit extensions, programming and testing", unit: "LS", kind: "inclusion", isRequired: true, submittalRequired: true, longLeadWeeks: 12 },
      { seq: 8, csiCode: "26 05 00", description: "Utility fees and owner IT active-network equipment", unit: "LS", kind: "exclusion", isRequired: false, submittalRequired: false },
      { seq: 9, csiCode: "26 51 13", description: "Alternate price for equal LED fixture package meeting schedule performance", unit: "LS", kind: "va_option", isRequired: false, submittalRequired: true, longLeadWeeks: 12 },
    ]
  );

  // ── Subs, invitations, bids ─────────────────────────────────────
  async function sub(name: string, trade: string) {
    return prisma.subcontractor.create({ data: { name, trades: [trade] } });
  }
  async function invite(pkgId: string, subId: string, token: string, intent: "bidding" | "no_bid" | "none", sentAt: Date) {
    return prisma.invitation.create({
      data: { bidPackageId: pkgId, subcontractorId: subId, token, sentAt, openedAt: intent !== "none" ? sentAt : null, intent },
    });
  }
  async function bid(
    invitationId: string,
    submittedAt: Date,
    total: bigint,
    lines: Array<{ scopeLineItemId?: string; amount: bigint; unitPrice?: bigint; included: boolean; note?: string }>
  ) {
    return prisma.bid.create({
      data: {
        invitationId,
        submittedAt,
        total,
        source: "portal",
        addendaAcked: ["1"],
        bidLines: { create: lines.map((l) => ({ ...l, source: "sub" as const })) },
      },
    });
  }

  const invAt = new Date("2026-08-25");
  const bidAt = new Date("2026-09-03");

  // 2A
  {
    const orange = await sub("Orange Demo & Interiors LLC", "Selective Demolition and Framing");
    const sunstate = await sub("Sunstate Partition Group", "Selective Demolition and Framing");
    const metro = await sub("Metro Selective Services", "Selective Demolition and Framing");
    const invOrange = await invite(pkg2A.pkg.id, orange.id, "inv_2a_orange", "bidding", invAt);
    const invSunstate = await invite(pkg2A.pkg.id, sunstate.id, "inv_2a_sunstate", "bidding", invAt);
    await invite(pkg2A.pkg.id, metro.id, "inv_2a_metro", "no_bid", invAt);
    const L = pkg2A.lines;
    await bid(invOrange.id, bidAt, 192_000_00n, [
      { scopeLineItemId: L[1].id, amount: 68_400_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 16_200_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 94_600_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 12_800_00n, included: true },
      { scopeLineItemId: L[6].id, amount: 14_750_00n, included: false, note: "Add alternate — VE abuse-resistant gypsum" },
    ]);
    await bid(invSunstate.id, bidAt, 192_700_00n, [
      { scopeLineItemId: L[1].id, amount: 62_500_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 101_900_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 9_800_00n, included: true },
      { amount: 18_500_00n, included: true, note: "Temporary hard dust walls and zipper doors — sub-added scope" },
    ]);
  }

  // 6A
  {
    const cypress = await sub("Cypress Architectural Millwork", "Architectural Casework");
    const occ = await sub("Orange County Casework LLC", "Architectural Casework");
    const precision = await sub("Precision Cabinet Works", "Architectural Casework");
    const invCypress = await invite(pkg6A.pkg.id, cypress.id, "inv_6a_cypress", "bidding", invAt);
    const invOcc = await invite(pkg6A.pkg.id, occ.id, "inv_6a_occ", "bidding", invAt);
    await invite(pkg6A.pkg.id, precision.id, "inv_6a_precision", "none", invAt);
    const L = pkg6A.lines;
    await bid(invCypress.id, bidAt, 263_000_00n, [
      { scopeLineItemId: L[1].id, amount: 148_600_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 77_400_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 28_600_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 8_400_00n, included: true },
      { scopeLineItemId: L[6].id, amount: -9_200_00n, included: false, note: "Deduct alternate — equal solid-surface manufacturer" },
    ]);
    await bid(invOcc.id, bidAt, 185_550_00n, [
      { scopeLineItemId: L[1].id, amount: 153_900_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 24_750_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 6_900_00n, included: true },
    ]);
  }

  // 8A
  {
    const gateway = await sub("Gateway Door & Glass Inc.", "Doors, Frames, Hardware and Glazing");
    const central = await sub("Central Openings Group", "Doors, Frames, Hardware and Glazing");
    const premier = await sub("Premier Hardware Supply", "Doors, Frames, Hardware and Glazing");
    const invGateway = await invite(pkg8A.pkg.id, gateway.id, "inv_8a_gateway", "bidding", invAt);
    const invCentral = await invite(pkg8A.pkg.id, central.id, "inv_8a_central", "bidding", invAt);
    await invite(pkg8A.pkg.id, premier.id, "inv_8a_premier", "no_bid", invAt);
    const L = pkg8A.lines;
    await bid(invGateway.id, bidAt, 334_900_00n, [
      { scopeLineItemId: L[1].id, amount: 58_750_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 46_200_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 118_400_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 67_300_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 31_400_00n, included: true },
      { scopeLineItemId: L[6].id, amount: 12_850_00n, included: true },
    ]);
    await bid(invCentral.id, bidAt, 324_100_00n, [
      { scopeLineItemId: L[1].id, amount: 55_100_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 48_900_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 126_600_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 63_900_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 29_600_00n, included: true },
      { amount: 12_500_00n, included: true, note: "Freight escalation allowance after 60 days — sub-added allowance" },
    ]);
  }

  // 9A
  {
    const magnolia = await sub("Magnolia Interior Finishes", "Interior Finishes");
    const i4 = await sub("I-4 Commercial Flooring", "Interior Finishes");
    const orlandoFinish = await sub("Orlando Finish Systems", "Interior Finishes");
    const invMagnolia = await invite(pkg9A.pkg.id, magnolia.id, "inv_9a_magnolia", "bidding", invAt);
    const invI4 = await invite(pkg9A.pkg.id, i4.id, "inv_9a_i4", "bidding", invAt);
    await invite(pkg9A.pkg.id, orlandoFinish.id, "inv_9a_orlando", "none", invAt);
    const L = pkg9A.lines;
    await bid(invMagnolia.id, bidAt, 675_900_00n, [
      { scopeLineItemId: L[1].id, amount: 28_000_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 74_600_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 86_500_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 119_800_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 83_900_00n, included: true },
      { scopeLineItemId: L[6].id, amount: 44_800_00n, included: true },
      { scopeLineItemId: L[7].id, amount: 137_500_00n, included: true },
      { scopeLineItemId: L[8].id, amount: 28_600_00n, included: true },
      { scopeLineItemId: L[9].id, amount: 72_200_00n, included: true, note: "Combines signage and remaining specialties (scope lines 9 & 10)" },
      { scopeLineItemId: L[11].id, amount: 785n, unitPrice: 785n, included: true },
    ]);
    await bid(invI4.id, bidAt, 397_300_00n, [
      { scopeLineItemId: L[1].id, amount: 32_000_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 79_900_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 91_100_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 113_700_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 80_600_00n, included: true },
      { scopeLineItemId: L[11].id, amount: 840n, unitPrice: 840n, included: true },
    ]);
  }

  // 22A
  {
    const lakeEola = await sub("Lake Eola Mechanical LLC", "Plumbing and HVAC");
    const centralAir = await sub("Central Air & Pipe Inc.", "Plumbing and HVAC");
    const metroMep = await sub("Metro MEP Services", "Plumbing and HVAC");
    const invLakeEola = await invite(pkg22A.pkg.id, lakeEola.id, "inv_22a_lakeeola", "bidding", invAt);
    const invCentralAir = await invite(pkg22A.pkg.id, centralAir.id, "inv_22a_centralair", "bidding", invAt);
    await invite(pkg22A.pkg.id, metroMep.id, "inv_22a_metromep", "no_bid", invAt);
    const L = pkg22A.lines;
    await bid(invLakeEola.id, bidAt, 570_000_00n, [
      { scopeLineItemId: L[1].id, amount: 68_400_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 54_200_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 73_600_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 171_500_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 119_800_00n, included: true },
      { scopeLineItemId: L[6].id, amount: 24_600_00n, included: true },
      { scopeLineItemId: L[7].id, amount: 57_900_00n, included: true },
      { scopeLineItemId: L[8].id, amount: 285_00n, unitPrice: 285_00n, included: true },
    ]);
    await bid(invCentralAir.id, bidAt, 518_900_00n, [
      { scopeLineItemId: L[1].id, amount: 71_100_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 51_900_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 76_400_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 166_800_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 124_900_00n, included: true },
      { scopeLineItemId: L[6].id, amount: 27_800_00n, included: true },
      { amount: 18_500_00n, included: true, note: "Condensate pump replacement allowance — sub-added, not in GC scope" },
    ]);
  }

  // 26A
  {
    const tower = await sub("Tower Electrical Contractors", "Electrical and Low Voltage");
    const systems408 = await sub("408 Systems & Electric", "Electrical and Low Voltage");
    const cityBeautiful = await sub("City Beautiful Electric", "Electrical and Low Voltage");
    const invTower = await invite(pkg26A.pkg.id, tower.id, "inv_26a_tower", "bidding", invAt);
    const inv408 = await invite(pkg26A.pkg.id, systems408.id, "inv_26a_408", "bidding", invAt);
    await invite(pkg26A.pkg.id, cityBeautiful.id, "inv_26a_citybeautiful", "none", invAt);
    const L = pkg26A.lines;
    await bid(invTower.id, bidAt, 787_900_00n, [
      { scopeLineItemId: L[1].id, amount: 188_400_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 82_300_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 219_800_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 74_600_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 96_600_00n, included: true },
      { scopeLineItemId: L[6].id, amount: 58_400_00n, included: true },
      { scopeLineItemId: L[7].id, amount: 67_800_00n, included: true },
      { scopeLineItemId: L[9].id, amount: -18_600_00n, included: false, note: "Deduct alternate — equal LED fixture package" },
    ]);
    await bid(inv408.id, bidAt, 661_700_00n, [
      { scopeLineItemId: L[1].id, amount: 181_900_00n, included: true },
      { scopeLineItemId: L[2].id, amount: 79_800_00n, included: true },
      { scopeLineItemId: L[3].id, amount: 226_700_00n, included: true },
      { scopeLineItemId: L[4].id, amount: 71_900_00n, included: true },
      { scopeLineItemId: L[5].id, amount: 101_400_00n, included: true },
    ]);
  }

  // ── Budget ──────────────────────────────────────────────────────
  const budgetDefs = [
    { pkg: pkg2A.pkg, csiCode: "02", budget: 200_000_00n, current: 192_000_00n, buyoutExpected: 189_500_00n, tags: ["Long lead"] as string[] },
    { pkg: pkg6A.pkg, csiCode: "06", budget: 280_000_00n, current: 263_000_00n, buyoutExpected: 258_000_00n, tags: ["Long lead"] as string[] },
    { pkg: pkg8A.pkg, csiCode: "08", budget: 345_000_00n, current: 324_100_00n, buyoutExpected: 318_000_00n, tags: ["Long lead"] as string[] },
    { pkg: pkg9A.pkg, csiCode: "09", budget: 705_000_00n, current: 675_900_00n, buyoutExpected: 660_000_00n, tags: ["Long lead"] as string[] },
    { pkg: pkg22A.pkg, csiCode: "22", budget: 595_000_00n, current: 570_000_00n, buyoutExpected: 558_000_00n, tags: ["Long lead"] as string[] },
    { pkg: pkg26A.pkg, csiCode: "26", budget: 815_000_00n, current: 787_900_00n, buyoutExpected: 770_000_00n, tags: ["Long lead"] as string[] },
  ];
  for (const b of budgetDefs) {
    await prisma.budgetLine.create({
      data: {
        projectId: project.id,
        bidPackageId: b.pkg.id,
        csiCode: b.csiCode,
        description: `${b.pkg.code} — ${b.pkg.name}`,
        budget: b.budget,
        current: b.current,
        buyoutExpected: b.buyoutExpected,
        tags: b.tags,
      },
    });
  }

  await prisma.budgetRevision.create({
    data: {
      projectId: project.id,
      revNo: 0,
      note: "Initial from packages",
      createdBy: "R. Harper",
      createdAt: new Date("2026-08-20"),
      snapshot: Object.fromEntries(budgetDefs.map((b) => [`${b.pkg.code} — ${b.pkg.name}`, Number(b.budget)])),
    },
  });
  await prisma.budgetRevision.create({
    data: {
      projectId: project.id,
      revNo: 1,
      note: "Post-ITB baseline",
      createdBy: "R. Harper",
      createdAt: new Date(),
      snapshot: Object.fromEntries(budgetDefs.map((b) => [`${b.pkg.code} — ${b.pkg.name}`, Number(b.current)])),
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
