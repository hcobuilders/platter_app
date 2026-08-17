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

export const CSI_CODES: CsiCode[] = SECTIONS.map(([code, title]) => {
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
  return CSI_CODES.filter(
    (c) => c.title.toLowerCase().includes(qLower) || c.divisionName.toLowerCase().includes(qLower)
  ).slice(0, limit);
}
