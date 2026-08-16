# Platter — Step 1 Plan

Two things to approve before I draw anything: the **data model** (because it determines what every screen can show) and the **wireframe index** (so we agree on the map before I draw forty screens).

---

## Part A — Core data model

### The atom

`scope_line_item` is the single row that every workflow in the roadmap touches:

```
scope_line_item
  ├─ written in    → Scope building workflow
  ├─ shown as      → Planroom scope view (sub sees it, exports xlsx)
  ├─ priced into   → bid_line (sub's number lands ON the line, not beside it)
  ├─ compared in   → Bid tab (leveling is automatic because bids share line ids)
  ├─ rolled up to  → budget_line
  ├─ recited in    → Subcontract exhibit (inclusions/exclusions)
  └─ triggers      → Submittal requirement (if long_lead or submittal_required)
```

Because every sub's price attaches to a shared line id, **bid leveling stops being a manual mapping exercise** — gaps show up as lines with no `bid_line`, and plugs are just a `bid_line` with `source = 'plug'`.

### Tables

**Project spine**
```
project           number, name, address, lat/lng, owner, architect_of_record,
                  delivery_method, bond_pct, retainage_pct, status
                  (draft|scoping|bidding|leveling|submitted|awarded|lost),
                  external_ids jsonb  ← Procore / SharePoint / Dropbox from day one
project_date      project_id, kind (itb_out|site_walk|rfi_cutoff|addenda_cutoff|
                  submission_due|award_target), at, is_mandatory, notes
project_note      project_id, body, author, pinned_at
audit_event       entity, entity_id, field, old, new, actor, at
```

**Documents & parsing** *(priority #1)*
```
document          project_id, filename, storage_key, sharepoint_id,
                  kind (spec|drawing|addendum|geotech|itb|contract|other),
                  discipline, sheet_no, page_count, ocr_required, parse_status
parse_run         document_id, model, prompt_version, started_at, finished_at,
                  token_cost, error
extracted_field   entity_type, entity_id, field_path, value_json,
                  confidence (0–1), document_id, page, bbox,
                  state (pending|confirmed|corrected|rejected),
                  confirmed_by, confirmed_at, parse_run_id
spec_section      project_id, csi_code, title, document_id, page_from, page_to
```
`extracted_field` is the trust layer. Nothing parsed is written straight to `project`; it lands here, gets a confidence badge in the UI, and only becomes canonical when confirmed. Clicking any parsed value opens the source page with the bbox highlighted.

**Scope & packages**
```
bid_package       project_id, code, name, csi_codes[], status, due_at,
                  budget_amount, requires_bond, long_lead
scope_line_item   bid_package_id, seq, csi_code, description, unit, qty,
                  kind (inclusion|exclusion|alternate|allowance|unit_price|
                        clarification|va_option),
                  is_required, submittal_required, long_lead_weeks,
                  spec_section_id, source_document_id, source_page
```

**Bidding**
```
subcontractor     name, dba, ein, fl_license, trades[], groups[], rating,
                  last_verified_at, prequal_json, notes
sub_contact       subcontractor_id, name, email, phone, is_itb_contact
invitation        bid_package_id, subcontractor_id, token, sent_at, opened_at,
                  intent (none|bidding|no_bid), feedback_requested
bid               invitation_id, submitted_at, total, addenda_acked[],
                  source (portal|xlsx_upload|manual), attachments[]
bid_line          bid_id, scope_line_item_id, amount, unit_price, qty,
                  included (bool), note, source (sub|parsed|plug|ours),
                  confidence          ← parsed sub xlsx reuses the same trust layer
addendum          project_id, number, issued_at, document_id, scope (all|trades[])
rfi               project_id, from_invitation_id, body, status, routed_to,
                  answer, answered_at
communication     project_id, subcontractor_id, kind, body, at, author
```

**Money**
```
budget_line       project_id, bid_package_id, csi_code, description,
                  budget, current, buyout_expected, awarded_to, note, tags[]
budget_revision   project_id, rev_no, snapshot jsonb, note, created_by, created_at
```
Revisions are full JSONB snapshots, not diffs — comparison is computed at read time. Simpler, and lets the "intelligent compare with summary" feature diff any two revisions without special-casing.

**Deferred to phase 2:** `subcontract`, `submittal`, `document_template`, `intelligence_report`.

### Two decisions worth flagging

1. **Money is stored as integer cents**, never float. Non-negotiable in an estimating tool.
2. **`bid_line.source`** distinguishes what the sub said, what AI parsed from their PDF, and what you plugged. The bid tab colors these differently. This is the difference between a tool you trust and one you double-check in Excel.

---

## Part B — Wireframe index

Every screen and state I'll draw, in build order. Batches 1–5 are phase 1 (the closed loop). Everything after is phase 2.

### Batch 1 — Intake & parse review *(priority #1)*
| # | Screen | States to draw |
|---|---|---|
| 1.1 | New project — intake | Empty · manual fields only · file drop active · SharePoint picker |
| 1.2 | Parse in progress | Per-document status list, streaming · OCR-required flag · one doc failed |
| 1.3 | **Parse review** — the trust screen | Split view: field list left, source PDF right with bbox highlight · high/medium/low confidence · missing field · two docs conflict · field confirmed · bulk confirm |
| 1.4 | Draft project handoff | "Draft" card + what's still unconfirmed · promote to active |
| 1.5 | Failure paths | Scanned drawing, no text layer · unsupported file · partial parse |

### Batch 2 — Dashboard & shell
| # | Screen | States |
|---|---|---|
| 2.1 | Dashboard grid | 1 / 6 / 30 projects · empty state |
| 2.2 | Project card anatomy | Draft · scoping · bidding · due <48h · overdue · awarded · lost · bond flag · mandatory site walk flag |
| 2.3 | Card interactions | Hover lift · address tooltip · tag edit popover · kebab menu · center band icon hover |
| 2.4 | Top nav | Desktop · iPad · mobile collapse |
| 2.5 | **Command bar** | Rest · `/` open with suggestions · typing `26-085` · typing `WH budget` · no match tooltip · iPad action sheet equivalent |

### Batch 3 — Project workspace & scope
| # | Screen | States |
|---|---|---|
| 3.1 | Project dashboard | Full L1/4 nav · collapsed to floating glyph cloud · mini map + renderings · timeline · edit history |
| 3.2 | Quick action popover | Log comm · add sub · open planroom · edit details |
| 3.3 | Scope tool — workflow chooser | Three flows presented |
| 3.4 | Flow 1: deep AI parse | Running · proposed packages + budget + schedule for review · accept/reject per package |
| 3.5 | Flow 2: spec-driven | Spec index → package proposal → requirement fill |
| 3.6 | Flow 3: manual | Side-by-side drawing/file index + selection tool populating requirements |
| 3.7 | Scope worksheet | Table view · line item editor · kind badges · long-lead flag · empty package |

### Batch 4 — ITB & sub-facing planroom *(priority #2)*
| # | Screen | States |
|---|---|---|
| 4.1 | ITB tool | Package → bidder matching · sub suggestions by trade/rating · stale-info warning |
| 4.2 | Invite composer | Template with tagged project details · custom email · preview · send confirmation |
| 4.3 | Planroom — landing | Magic link arrival · bid instructions · map + renderings · countdown |
| 4.4 | Planroom — scope | Invited scope expanded · other scopes collapsed · xlsx export |
| 4.5 | Planroom — documents | Index · viewer · annotate · download · print set |
| 4.6 | Planroom — addenda board | Realtime feed · trade-scoped vs all-sub · unacknowledged badge |
| 4.7 | Planroom — submit quote | Excel-style entry table · unit price preference · add lines · xlsx upload + parse-back · required attachments · addenda acknowledgment · validation errors |
| 4.8 | Planroom — RFI | Submit · notify-me email capture · get help (phone/email) |
| 4.9 | Planroom — prequal | License/phone autofill prompt · full form · post-bid feedback request |
| 4.10 | Planroom — no-bid | Decline with reason |

### Batch 5 — Bid tab & budget
| # | Screen | States |
|---|---|---|
| 5.1 | Bid tab | Comparison grid across subs · parsed vs stated vs plug coloring · scope gap highlighted · recommended plug · section/label rows · comments, colors, flags · Consight import |
| 5.2 | Budget table | Main view prefilled from packages · CSI 2026 / 16-div toggle · column show/hide/reorder · right-click menu · totals · change log with tags |
| 5.3 | Budget revisions | Save revision · compare two · generated summary |
| 5.4 | Lifecycle cost analysis | Setup · data entry · AI research pass · tuning interface |
| 5.5 | Automation & customization *(added S11, D-41 — not in the original index)* | No-code rule builder (condition → action) for plug recommendations and gap-flagging thresholds · reusable custom-column library · notification preferences |

### Batch 6 — Settings (minimal, phase 1)
| # | Screen | States |
|---|---|---|
| 6.1 | Appearance | Theme (light active, dark disabled-with-reason) · display preferences (compact rows, reduce motion, default budget view) · brand palette (read-only reference) |
| 6.2 | Profile & signature | Contact info · signature & avatar |
| 6.3 | Connected accounts | Overview (Outlook connected, SharePoint not yet) · Outlook detail (sending identity, send test, disconnect) · connect flow |
| 6.4 | Flags library *(closes E-06)* | List · new/edit flag (type-derived color) · merge flags |
| 6.5 | Trades & tags | Trades list · tags list |
| 6.6 | Package templates | List · new/edit template |

Expanded from the original one-line spec into concrete screens in S12; the Flags panel obligation (E-06) is folded in as 6.4.

### Phase 2 (wireframed later)
Subcontract workflow · submittal workflow · documents & templates builder · project intelligence + printable report · full sub database management.

---

## What I need from you

- **Approve or edit the batch order and screen list above.** Add anything I've missed, strike anything you don't want drawn.
- **Q-13:** which historical project should seed the database? Ideally one with complete docs, a real bid tab, and a known outcome.
- **Q-10:** the `./FILESTRUCTURE` folder template — needed for 1.4.
- **Q-08:** email provider + whether ITB must send from a LEMA domain — needed for 4.2.

On approval I draw Batch 1 as an interactive HTML wireframe document: real layout, real states, no styling commitment yet.
