// CSI MasterFormat (2018/2026) division + section reference data, used to
// validate and autocomplete CSI codes anywhere one is typed in the app.
// Not exhaustive of every published section — covers division titles plus
// the sections this app's seed data and typical commercial bid packages
// actually reference, so typing a shorthand digit string ("033000") or a
// keyword ("grading") resolves to a real code + title.

export interface CsiCode {
  code: string; // spaced canonical form, e.g. "03 30 00" or "10 21 13.19"
  title: string;
  division: string; // 2-digit division, e.g. "03"
  divisionName: string;
}

const DIVISION_NAMES: Record<string, string> = {
  "00": "Procurement and Contracting Requirements",
  "01": "General Requirements",
  "02": "Existing Conditions",
  "03": "Concrete",
  "04": "Masonry",
  "05": "Metals",
  "06": "Wood, Plastics, and Composites",
  "07": "Thermal and Moisture Protection",
  "08": "Openings",
  "09": "Finishes",
  "10": "Specialties",
  "11": "Equipment",
  "12": "Furnishings",
  "13": "Special Construction",
  "14": "Conveying Equipment",
  "21": "Fire Suppression",
  "22": "Plumbing",
  "23": "Heating, Ventilating, and Air Conditioning",
  "25": "Integrated Automation",
  "26": "Electrical",
  "27": "Communications",
  "28": "Electronic Safety and Security",
  "31": "Earthwork",
  "32": "Exterior Improvements",
  "33": "Utilities",
};

// The pre-2004 "16-division" MasterFormat — retired by CSI in favor of the
// 49-division scheme above, but still what a lot of older spec sections,
// legacy drawings, and some subs' own paperwork reference (S-notes
// v135a475: "make sure you use both masterformat lists (16 and 32)").
// Kept as a separate lookup rather than merged into DIVISION_NAMES so the
// modern division numbers stay the single source of truth for new data —
// this only widens what a search box will resolve.
export const LEGACY_DIVISION_NAMES: Record<string, string> = {
  "1": "General Requirements",
  "2": "Site Work",
  "3": "Concrete",
  "4": "Masonry",
  "5": "Metals",
  "6": "Wood and Plastics",
  "7": "Thermal and Moisture Protection",
  "8": "Doors and Windows",
  "9": "Finishes",
  "10": "Specialties",
  "11": "Equipment",
  "12": "Furnishings",
  "13": "Special Construction",
  "14": "Conveying Systems",
  "15": "Mechanical",
  "16": "Electrical",
};

// Legacy division → the modern division(s) it split into, so a search for
// the old "Division 15" or "Division 16" surfaces today's real codes
// instead of a dead end.
const LEGACY_TO_MODERN: Record<string, string[]> = {
  "1": ["01"],
  "2": ["02", "31", "32", "33"],
  "3": ["03"],
  "4": ["04"],
  "5": ["05"],
  "6": ["06"],
  "7": ["07"],
  "8": ["08"],
  "9": ["09"],
  "10": ["10"],
  "11": ["11"],
  "12": ["12"],
  "13": ["13"],
  "14": ["14"],
  "15": ["21", "22", "23", "25"],
  "16": ["26", "27", "28"],
};

const SECTIONS: Array<[string, string]> = [
  // 01 — General Requirements
  ["01 32 00", "Construction Progress Documentation"],
  ["01 33 00", "Submittal Procedures"],
  ["01 35 13", "Special Project Procedures"],
  ["01 45 00", "Quality Control"],
  ["01 74 19", "Construction Waste Management and Disposal"],
  // 02 — Existing Conditions
  ["02 41 00", "Demolition"],
  ["02 41 19", "Selective Demolition"],
  ["02 41 20", "Cutting, Fitting and Patching"],
  ["02 82 13", "Asbestos Abatement"],
  ["02 82 14", "Hazardous Material Assessment and Abatement"],
  // 03 — Concrete
  ["03 10 00", "Concrete Forming and Accessories"],
  ["03 20 00", "Concrete Reinforcing"],
  ["03 30 00", "Cast-in-Place Concrete"],
  ["03 35 00", "Concrete Finishing"],
  ["03 40 00", "Precast Concrete"],
  ["03 45 00", "Precast Architectural Concrete"],
  ["03 54 00", "Cast Underlayment"],
  ["03 62 00", "Non-Shrink Grouting"],
  // 04 — Masonry
  ["04 05 00", "Common Work Results for Masonry"],
  ["04 20 00", "Unit Masonry"],
  ["04 22 00", "Concrete Unit Masonry"],
  ["04 72 00", "Cast Stone Masonry"],
  // 05 — Metals
  ["05 12 00", "Structural Steel Framing"],
  ["05 21 00", "Steel Joist Framing"],
  ["05 31 00", "Steel Decking"],
  ["05 50 00", "Metal Fabrications"],
  ["05 51 00", "Metal Stairs"],
  ["05 52 00", "Metal Railings"],
  // 06 — Wood, Plastics, and Composites
  ["06 10 00", "Rough Carpentry"],
  ["06 16 00", "Sheathing"],
  ["06 41 00", "Architectural Wood Casework"],
  ["06 42 00", "Wood Paneling"],
  ["06 61 16", "Solid Surfacing Fabrications"],
  // 07 — Thermal and Moisture Protection
  ["07 21 00", "Thermal Insulation"],
  ["07 27 00", "Air Barriers"],
  ["07 42 13", "Metal Wall Panels"],
  ["07 54 23", "Thermoplastic-Polyolefin (TPO) Roofing"],
  ["07 84 00", "Firestopping"],
  ["07 92 00", "Joint Sealants"],
  // 08 — Openings
  ["08 11 13", "Hollow Metal Doors and Frames"],
  ["08 14 16", "Flush Wood Doors"],
  ["08 31 13", "Access Doors and Frames"],
  ["08 41 13", "Aluminum-Framed Entrances and Storefronts"],
  ["08 43 13", "Aluminum-Framed Storefronts"],
  ["08 44 13", "Glazed Aluminum Curtain Walls"],
  ["08 51 13", "Aluminum Windows"],
  ["08 71 00", "Door Hardware"],
  ["08 80 00", "Glazing"],
  ["08 87 23", "Safety and Security Films"],
  // 09 — Finishes
  ["09 05 61", "Common Work Results for Flooring Preparation"],
  ["09 21 16", "Gypsum Board Assemblies"],
  ["09 22 16", "Non-Structural Metal Framing"],
  ["09 30 00", "Tiling"],
  ["09 51 00", "Acoustical Ceilings"],
  ["09 65 00", "Resilient Flooring"],
  ["09 68 13", "Tile Carpeting"],
  ["09 72 00", "Wall Coverings"],
  ["09 91 23", "Interior Painting"],
  ["09 96 00", "High-Performance Coatings"],
  // 10 — Specialties
  ["10 14 23", "Panel Signage"],
  ["10 21 13.19", "Plastic Toilet Compartments"],
  ["10 26 00", "Wall and Door Protection"],
  ["10 28 00", "Toilet, Bath, and Laundry Accessories"],
  ["10 44 00", "Fire Protection Specialties"],
  ["10 56 13", "Metal Storage Shelving"],
  // 12 — Furnishings
  ["12 24 13", "Roller Window Shades"],
  ["12 36 00", "Countertops"],
  ["12 36 61", "Simulated Stone Countertops"],
  // 21 — Fire Suppression
  ["21 13 13", "Wet-Pipe Sprinkler Systems"],
  // 22 — Plumbing
  ["22 05 23", "General-Duty Valves for Plumbing Piping"],
  ["22 05 29", "Hangers and Supports for Plumbing Piping and Equipment"],
  ["22 05 53", "Identification for Plumbing Piping and Equipment"],
  ["22 07 00", "Plumbing Insulation"],
  ["22 11 16", "Domestic Water Piping"],
  ["22 13 16", "Sanitary Waste and Vent Piping"],
  ["22 13 19", "Sanitary Waste Piping Specialties"],
  ["22 40 00", "Plumbing Fixtures"],
  // 23 — HVAC
  ["23 05 00", "Common Work Results for HVAC"],
  ["23 05 17", "Sleeves and Sleeve Seals for HVAC Piping"],
  ["23 05 53", "Identification for HVAC Piping and Equipment"],
  ["23 05 93", "Testing, Adjusting, and Balancing for HVAC"],
  ["23 07 13", "Duct Insulation"],
  ["23 31 13", "Metal Ducts"],
  ["23 33 00", "Air Duct Accessories"],
  ["23 36 00", "Air Terminal Units"],
  ["23 37 13", "Diffusers, Registers, and Grilles"],
  ["23 37 23", "HVAC Gravity Ventilators"],
  ["23 82 00", "Convection Heating and Cooling Units"],
  // 25 — Integrated Automation
  ["25 30 00", "Instrumentation and Control for HVAC"],
  // 26 — Electrical
  ["26 05 00", "Common Work Results for Electrical"],
  ["26 05 01", "Electrical Utility Fees"],
  ["26 05 19", "Low-Voltage Electrical Power Conductors and Cables"],
  ["26 05 26", "Grounding and Bonding for Electrical Systems"],
  ["26 05 29", "Hangers and Supports for Electrical Systems"],
  ["26 05 33", "Raceway and Boxes for Electrical Systems"],
  ["26 05 53", "Identification for Electrical Systems"],
  ["26 09 23", "Lighting Control Devices"],
  ["26 27 26", "Wiring Devices"],
  ["26 28 17", "Enclosed Fuses and Circuit Breakers"],
  ["26 43 13", "Transient Voltage Suppression"],
  ["26 51 13", "Interior Lighting Fixtures"],
  // 27 — Communications
  ["27 10 00", "Structured Cabling"],
  // 28 — Electronic Safety and Security
  ["28 05 14", "Access Control"],
  ["28 31 11", "Digital, Addressable Fire-Alarm System"],
  // 31 — Earthwork
  ["31 22 00", "Grading"],
  ["31 23 00", "Excavation and Fill"],
  // 32 — Exterior Improvements
  ["32 12 16", "Asphalt Paving"],
  ["32 13 13", "Concrete Paving"],
  ["32 92 00", "Turf and Grasses"],
  // 33 — Utilities
  ["33 41 00", "Storm Utility Drainage Piping"],
];

// Broadened coverage pass (S-notes v135a475: "it doesnt appear this csi
// list is complete") — fills in divisions that had zero or thin coverage
// and adds more of the sections a typical commercial GC's bid packages
// actually reference. Still not exhaustive of the full published
// MasterFormat (thousands of sections across 49 divisions) — this app
// only carries the ones useful for autocomplete/validation, not a full
// CSI database.
const MORE_SECTIONS: Array<[string, string]> = [
  // 00 — Procurement and Contracting Requirements
  ["00 21 13", "Instructions to Bidders"],
  ["00 41 13", "Bid Form"],
  ["00 52 00", "Agreement Form"],
  ["00 61 00", "Bond Forms"],
  ["00 72 00", "General Conditions"],
  ["00 73 00", "Supplementary Conditions"],
  // 01 — General Requirements
  ["01 21 00", "Allowances"],
  ["01 23 00", "Alternates"],
  ["01 26 00", "Contract Modification Procedures"],
  ["01 29 00", "Payment Procedures"],
  ["01 31 00", "Project Management and Coordination"],
  ["01 40 00", "Quality Requirements"],
  ["01 50 00", "Temporary Facilities and Controls"],
  ["01 60 00", "Product Requirements"],
  ["01 70 00", "Execution and Closeout Requirements"],
  ["01 78 23", "Operation and Maintenance Data"],
  ["01 78 39", "Project Record Documents"],
  // 02 — Existing Conditions
  ["02 21 00", "Surveys"],
  ["02 32 00", "Geotechnical Investigations"],
  // 03 — Concrete
  ["03 05 00", "Common Work Results for Concrete"],
  ["03 21 00", "Reinforcement Bars"],
  ["03 31 00", "Structural Concrete"],
  ["03 37 00", "Specialty Placed Concrete"],
  ["03 39 00", "Concrete Curing"],
  // 04 — Masonry
  ["04 21 13", "Brick Masonry"],
  ["04 43 13", "Stone Masonry Veneer"],
  // 05 — Metals
  ["05 05 00", "Common Work Results for Metals"],
  ["05 40 00", "Cold-Formed Metal Framing"],
  ["05 53 00", "Metal Gratings"],
  ["05 58 00", "Formed Metal Fabrications"],
  // 06 — Wood, Plastics, and Composites
  ["06 05 73", "Wood Treatment"],
  ["06 17 53", "Shop-Fabricated Wood Trusses"],
  ["06 65 00", "Plastic Simulated Wood Trim"],
  // 07 — Thermal and Moisture Protection
  ["07 11 13", "Bituminous Dampproofing"],
  ["07 13 00", "Sheet Waterproofing"],
  ["07 25 00", "Weather Barriers"],
  ["07 41 13", "Metal Roof Panels"],
  ["07 46 00", "Siding"],
  ["07 51 13", "Built-Up Asphalt Roofing"],
  ["07 62 00", "Sheet Metal Flashing and Trim"],
  ["07 72 00", "Roof Accessories"],
  // 08 — Openings
  ["08 12 13", "Hollow Metal Frames"],
  ["08 33 23", "Overhead Coiling Doors"],
  ["08 36 13", "Sectional Doors"],
  ["08 42 13", "Aluminum-Framed Entrances"],
  ["08 91 19", "Fixed Louvers"],
  // 09 — Finishes
  ["09 24 00", "Portland Cement Plastering"],
  ["09 29 00", "Gypsum Board"],
  ["09 53 00", "Acoustical Ceiling Suspension Assemblies"],
  ["09 64 00", "Wood Flooring"],
  ["09 67 23", "Resinous Flooring"],
  ["09 77 23", "Fabric-Wrapped Panels"],
  ["09 84 13", "Fixed Sound-Absorptive Panels"],
  ["09 93 00", "Staining and Transparent Finishing"],
  // 10 — Specialties
  ["10 11 00", "Visual Display Units"],
  ["10 22 13", "Wire Mesh Partitions"],
  ["10 22 26", "Operable Partitions"],
  ["10 51 13", "Metal Lockers"],
  ["10 73 00", "Protective Covers"],
  // 11 — Equipment
  ["11 13 00", "Loading Dock Equipment"],
  ["11 24 23", "Window Washing Equipment"],
  ["11 40 00", "Foodservice Equipment"],
  // 12 — Furnishings
  ["12 21 13", "Horizontal Louver Blinds"],
  ["12 32 00", "Manufactured Wood Casework"],
  ["12 48 13", "Entrance Floor Mats and Frames"],
  ["12 93 00", "Site Furnishings"],
  // 13 — Special Construction
  ["13 34 19", "Metal Building Systems"],
  // 14 — Conveying Equipment
  ["14 21 00", "Electric Traction Elevators"],
  ["14 24 00", "Hydraulic Elevators"],
  ["14 31 00", "Escalators"],
  // 21 — Fire Suppression
  ["21 05 00", "Common Work Results for Fire Suppression"],
  ["21 12 00", "Fire-Suppression Standpipes"],
  ["21 30 00", "Fire Pumps"],
  // 22 — Plumbing
  ["22 08 00", "Commissioning of Plumbing"],
  ["22 14 00", "Facility Storm Drainage"],
  ["22 33 00", "Electric Domestic Water Heaters"],
  ["22 42 00", "Commercial Plumbing Fixtures"],
  // 23 — HVAC
  ["23 09 23", "Direct-Digital Control System for HVAC"],
  ["23 21 13", "Hydronic Piping"],
  ["23 25 00", "HVAC Water Treatment"],
  ["23 34 00", "HVAC Fans"],
  ["23 62 00", "Packaged Compressor and Condenser Units"],
  ["23 74 00", "Packaged Outdoor HVAC Equipment"],
  ["23 81 00", "Decentralized Unitary HVAC Equipment"],
  // 25 — Integrated Automation
  ["25 10 00", "Integrated Automation Network Equipment"],
  ["25 90 00", "Integrated Automation Control Sequences"],
  // 26 — Electrical
  ["26 22 00", "Low-Voltage Transformers"],
  ["26 24 16", "Panelboards"],
  ["26 24 19", "Motor-Control Centers"],
  ["26 29 00", "Low-Voltage Controllers"],
  ["26 32 13", "Engine Generators"],
  ["26 33 13", "Batteries and Battery Chargers"],
  ["26 36 00", "Transfer Switches"],
  ["26 52 00", "Emergency Lighting"],
  ["26 56 00", "Exterior Lighting"],
  // 27 — Communications
  ["27 11 00", "Communications Equipment Room Fittings"],
  ["27 15 00", "Communications Horizontal Cabling"],
  ["27 21 00", "Data Communications Network Equipment"],
  ["27 41 00", "Audio-Video Systems"],
  ["27 51 00", "Distributed Audio-Video Communications Systems"],
  // 28 — Electronic Safety and Security
  ["28 13 00", "Access Control Systems"],
  ["28 23 00", "Video Surveillance"],
  ["28 31 00", "Fire Detection and Alarm"],
  ["28 46 00", "Fire Detection and Alarm Interfaces"],
  // 31 — Earthwork
  ["31 05 00", "Common Work Results for Earthwork"],
  ["31 25 00", "Erosion and Sedimentation Controls"],
  ["31 31 16", "Termite Control"],
  ["31 63 00", "Bored Piles"],
  // 32 — Exterior Improvements
  ["32 05 00", "Common Work Results for Exterior Improvements"],
  ["32 11 23", "Aggregate Base Courses"],
  ["32 14 13", "Precast Concrete Unit Paving"],
  ["32 17 23", "Pavement Markings"],
  ["32 31 13", "Chain Link Fences and Gates"],
  ["32 32 13", "Cast-in-Place Concrete Retaining Walls"],
  ["32 84 00", "Planting Irrigation"],
  ["32 91 13", "Soil Preparation"],
  ["32 93 00", "Plants"],
  // 33 — Utilities
  ["33 05 00", "Common Work Results for Utilities"],
  ["33 11 00", "Water Utility Distribution Piping"],
  ["33 31 00", "Sanitary Utility Sewerage Piping"],
  ["33 71 00", "Electrical Utility Transmission and Distribution"],
];

export const CSI_CODES: CsiCode[] = [...SECTIONS, ...MORE_SECTIONS].map(([code, title]) => {
  const division = code.slice(0, 2);
  return { code, title, division, divisionName: DIVISION_NAMES[division] ?? "Other" };
});

// Sorted explicitly by code string — Object.entries would otherwise put
// the non-leading-zero keys ("10".."33") first in numeric order, then
// "00".."09" afterward, since JS reorders integer-like object keys but
// "01" etc. don't qualify (their canonical form drops the leading zero).
export const CSI_DIVISIONS: Array<{ code: string; name: string }> = Object.entries(DIVISION_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.code.localeCompare(b.code));

// Strips everything but digits and dots, for comparing "033000" against
// "03 30 00" or "10 21 13.19" against "102113.19".
function digitsOnly(s: string): string {
  return s.replace(/[^0-9.]/g, "");
}

// Given raw user input (spaced, unspaced, with or without a decimal
// sub-section), returns the exact CsiCode match if one exists.
export function lookupExactCsi(raw: string): CsiCode | undefined {
  const q = raw.trim();
  if (!q) return undefined;
  const qDigits = digitsOnly(q);
  if (!qDigits) return undefined;
  return CSI_CODES.find((c) => digitsOnly(c.code) === qDigits);
}

// Given partial input, returns the best-matching codes — by digit prefix
// if the input looks numeric, otherwise by title/division-name substring.
// Also resolves a legacy 16-division reference ("division 16", "old div
// 15") to the modern codes it maps to, so a query using the retired
// scheme still finds real, current results instead of nothing.
export function findCsiMatches(raw: string, limit = 8): CsiCode[] {
  const q = raw.trim();
  if (!q) return [];
  const qDigits = digitsOnly(q);
  const looksNumeric = qDigits.length > 0 && qDigits.length >= q.replace(/\s/g, "").length - 1;

  if (looksNumeric) {
    const byPrefix = CSI_CODES.filter((c) => digitsOnly(c.code).startsWith(qDigits));
    if (byPrefix.length > 0) return byPrefix.slice(0, limit);
  }

  const qLower = q.toLowerCase();
  const legacyMatch = qLower.match(/\bdiv(?:ision)?\.?\s*(\d{1,2})\b/) ?? (/^\d{1,2}$/.test(qLower) ? [null, qLower] : null);
  if (legacyMatch) {
    const modernDivs = LEGACY_TO_MODERN[legacyMatch[1]];
    if (modernDivs) {
      const byLegacyDiv = CSI_CODES.filter((c) => modernDivs.includes(c.division));
      if (byLegacyDiv.length > 0) return byLegacyDiv.slice(0, limit);
    }
  }

  return CSI_CODES.filter(
    (c) =>
      c.title.toLowerCase().includes(qLower) ||
      c.divisionName.toLowerCase().includes(qLower) ||
      Object.entries(LEGACY_DIVISION_NAMES).some(
        ([legacyCode, legacyName]) => legacyName.toLowerCase().includes(qLower) && LEGACY_TO_MODERN[legacyCode]?.includes(c.division)
      )
  ).slice(0, limit);
}
