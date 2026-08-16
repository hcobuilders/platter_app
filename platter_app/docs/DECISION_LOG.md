# Platter — Decision Log

Running record of every locked decision, its rationale, and what's still open.
Paste this file into any new chat to restore full context.

**Product:** Platter — preconstruction command center (LEMA, Florida GC)
**Owner:** single design/build stakeholder, iterating per the 8-step schedule in `PLATTER_APP.md`
**Status:** Step 0 — discovery & identity. Step 1 (wireframes) not yet started.

---

## 1. Locked decisions

| # | Decision | Rationale | Session |
|---|---|---|---|
| D-01 | Product name stays **Platter**. Mark = four cells, one lifted. | Reads as the scope matrix with one bid package pulled off the surface. Encodes the product's core gesture rather than illustrating a dinner plate. Survives 16px. | S1 |
| D-02 | ~~Palette: Vellum & Brass~~ **Superseded by D-18 (S4).** | — | S1 |
| D-03 | **Brass is reserved for selection/active state only.** Flag red is reserved for bond, mandatory items, and overdue. Neither is ever decorative. | With 15 workflows, semantic color discipline is the only thing preventing visual chaos. A user must be able to learn "brass = what I'm acting on" once. | S1 |
| D-04 | Type: **Archivo Expanded** (display) / **Inter** (body) / **JetBrains Mono** (data). | Expanded grotesque gives Swiss-signage character without novelty. Mono for all numerics is functional, not stylistic — bid tabs and budget columns require tabular figures. | S1 |
| D-05 | **Every number in the app is monospaced and tabular-lined.** CSI codes, money, dates, quantities, percentages. | Column alignment is a correctness feature in estimating, not a taste preference. | S1 |
| D-06 | ~~Card radius 3px~~ **Radius superseded by D-20 (S4).** Lift behavior stands: 1px border, 4px lift + soft shadow on hover, 200ms cubic-bezier. | Matches roadmap's "sharp border small radii, lift on hover." Consistent with the logo. | S1 |
| D-07 | **Priority order set by owner:** 1) doc parsing → structured data, 2) planroom/ITB adoption, 3) bid tab → budget leveling, 4) cross-app sync. | Reorders the whole build. Intake + parse-review is now wireframe batch 1; dashboard drops to batch 2. Cross-app sync stays at step 7. | S2 |
| D-08 | **Real Postgres + seeded historical project** backs the step-3 prototype. Railway Postgres alongside the app. | Owner accepted R-02. Leveling, revisions and roll-up can't be faked convincingly. | S2 |
| D-09 | Internal side is **3 users max, no permission system.** Single shared org, `created_by` stamped on every mutation, full edit rights for all. | Owner: "me + 1–2 estimators." Roles are a phase-2 concern at most; building RBAC now costs a week and buys nothing. Audit trail still required (roadmap asks for edit history). | S2 |
| D-10 | **Two auth systems, deliberately separate:** internal = email + password or Microsoft OAuth (3 seats). Sub-facing planroom = magic link only, no account, no password, token scoped to one invitation. | Sub adoption is priority #2 and account creation is where it dies. Also keeps the external surface from ever touching the internal session model. | S2 |
| D-11 | **Storage format is MasterFormat 2026.** 16-division is a display transform only, via a lookup table. Toggle lives in the budget and scope views. | Roadmap wants both views. One canonical store, one mapping, no dual-entry. | S2 |
| D-12 | **Theme: dark shell, light work surface.** Nav, sidebar and command bar are Slate; tables, sheets, planroom and documents are Vellum. Full dark mode is a settings toggle, phase 2. | Estimators read tables for hours — light surfaces win there. The dark chassis gives the app its instrument character and matches the roadmap's anchored dark command bar. | S2 |
| D-13 | **`extracted_field` is a single generic provenance table**, not per-entity columns. Every AI-derived value anywhere in the app carries confidence + document + page + bbox + confirmation state. | Implements R-06 once instead of twenty times, and makes "show me where this came from" a universal interaction. | S2 |
| D-14 | **Email: provider-abstracted `Mailer` interface from day one.** Prototype sends via a transactional provider on a neutral domain; production swaps to **Microsoft Graph `sendMail`** as the estimating mailbox. Settings gets a "Connected accounts → Outlook" panel with connect/disconnect, sending identity picker, and a send-test button. | Owner uses Outlook/M365 and wants to send on-domain eventually but not to be blocked now. One interface, two adapters, no rewrite. Sending as a real mailbox also means ITB replies land in a real inbox and threading works. | S3 |
| D-15 | **The SharePoint file structure is a write-back contract, not a storage convention.** Platter maintains it: creates the full tree at draft creation, writes `_PROJECT_BRIEF.md` into `01` on every confirmation change, writes the leveling sheet into `04` on bid-tab export, creates `05/{package code} {name}/` folders on package creation, enforces `rev_#_date` naming in `09`, and auto-converts finalized proposal HTML to PDF. | The structure doc describes outputs Platter owes the file system, several of which are already features in the roadmap. Treating it as passive storage would mean rebuilding these later as one-off exports. | S3 |
| D-16 | **Package code convention: `{division}{letter}` — `3A`, `12A`, `26B`.** Folder name is `{code} {name}`. Code is the stable key; name is editable. | Taken directly from the file structure's example folders. Gives packages a short, sortable, human-spoken handle — which is also what the command bar needs (`26-085 3A`). | S3 |
| D-18 | **Palette: Cerulean & Apricot** (owner-supplied). Deep Cerulean `#0E1F27` · Floral White `#FEF9EF` · Apricot Cream `#FFCB77` · Cerulean `#227C9D` · Light Sea Green `#17C3B2` · Grapefruit `#FE6D73`. | Owner's chosen scheme. Warmer and more approachable than Vellum & Brass — which suits a tool that external subcontractors also use, not just estimators. | S4 |
| D-19 | **Semantics are carried over unchanged from D-03, only the hues moved.** Apricot = selection/focus/active, and nothing else. Sea green = confirmed/complete/high confidence. Grapefruit = bond, mandatory, overdue, low confidence. Cerulean = structure, links, primary data. | The discipline was always the point, not the specific colors. Preserving the mapping means every wireframe drawn so far stays valid and the user's learned vocabulary transfers. | S4 |
| D-20 | **Two-tier color system: bright hue fills, dark shade speaks.** Every brand hue carries a paired text shade — apricot `#7A4E08`, sea green `#0A6B62`, grapefruit `#A8262D`, cerulean `#1A6480` — used strictly for type and hairlines on light surfaces. | Three of the five supplied colors fail contrast as text on floral white; apricot lands near 1.3:1. Without this split the palette is either illegible or unusable. Non-negotiable for an app that must stay readable on a jobsite iPad in daylight. | S4 |
| D-21 | **Radius scale: 5 / 8 / 12 / 16 / 22 / pill.** xs hairline insets · sm fields · md tables and inner panels · lg cards and frames · xl modals and stages · pill for chips, tags, buttons, progress bars. | Owner asked for rounder. Scaling rather than globally rounding keeps hierarchy — a chip and a modal shouldn't share a corner. Most of the perceived softening comes from pill-shaped chips and buttons. | S4 |
| D-22 | **Deep Cerulean `#0E1F27` is derived, not supplied** — the cerulean hue at 11% lightness. Ambient cerulean/sea-green radial washes on the dark shell. | The supplied palette has no dark value, but D-12 requires a dark shell. Deriving it from cerulean rather than using neutral black keeps the whole system on one hue family. | S4 |
| D-23 | **Logo revised: all four cells now carry the outline**, corner radius 1.5 → 4.5, lifted cell filled with an apricot → grapefruit gradient. | Apricot alone on floral white is too low-contrast to hold the mark. Stroking all four fixes legibility and reads as more deliberate geometry. The sunset gradient is the only place the two warm colors meet, which is what makes it read as identity rather than UI. | S4 |
| D-29 | **Dashboard sorts by bid date ascending by default**, and status counts double as filters in a single toolbar row. | The deadline is the only ordering an estimator works to. Alphabetical and recently-modified both bury the thing that's due Friday. | S6 |
| D-30 | **Card band is glyphs only, label on hover** (touch: first tap reveals, second commits). Four glyphs: budget table · invite bidders · log communication · planroom. | Roadmap asks for glyphs with clean hover panels and no unnecessary copy. Four captions across thirty cards is ~90 words of chrome. Commits us to commissioning one coherent icon set rather than accumulating icons per feature. | S6 |
| D-31 | **Card footer shows proposed budget and names its source**, on a fixed confidence ladder: deep parse → budget table → leveled → contract value. | Same slot, same format, escalating reliability. The label is what stops an AI parse estimate from being mistaken for a committed number three weeks later. Creates an obligation for the Batch 5 budget tool to emit these states. | S6 |
| D-32 | **Urgency is an inset ring, not a colored card.** Under 48h the due date and countdown go grapefruit; urgent cards drop unneeded date columns and show unquoted package count instead. Overdue is a distinct state from urgent. | Colored cards stop being scannable in a grid. A card at deadline answers a different question than a card at kickoff, so the content adapts, not just the color. | S6 |
| D-33 | **Rows mode alongside cards**, toggle remembered per user. Closed projects dim to 62%, restore on hover. | Cards stop scanning past ~15 projects, and the historical-data goal requires closed projects stay reachable without competing with live work. | S6 |
| D-34 | **Logo centers on the dashboard, moves left inside a project** where the center belongs to project name + number. | Roadmap specifies both. Inside a project, confirming which project you're in matters more than branding — especially before editing a budget. | S6 |
| D-35 | **Phone is read-only by design.** No card band, no command bar. iPad gets a scrollable nav chip row and a floating glyph opening the command registry as a sheet. | Roadmap asks for "viewable on sm-mobile," not usable. Shipping controls too small to hit is worse than omitting them. | S6 |
| D-36 | **Command bar grammar: `{project} {package|tool}`** — `26-085`, `26-085 3A`, `WH budget`. Ambiguity is displayed rather than resolved. 400ms resolution budget, then an inline "not recognized" in grapefruit. | Reuses the package code convention (D-16) as a spoken handle. Showing the runner-up catches wrong jumps before they happen; a hard timeout keeps it feeling like a command line rather than a search box. | S6 |
| D-37 | **External links (Procore, SharePoint) render disabled-with-reason before step 7, not hidden.** Grouped under "Open in" with ↗. | The user should know the seam exists and where integration will land, rather than discovering features appearing later. | S6 |
| D-24 | **Design system v1.0 established** with a two-layer token architecture: primitive ramps (7-step cerulean, 5-step sea/apricot/coral) and semantic tokens that name a job. Components reference semantic tokens only — a raw hex in a component is a bug. | The palette already changed once. This makes the next change a one-file edit rather than a rebuild, and it's the only structure that survives handoff into Figma, Tailwind, or a real codebase. | S5 |
| D-25 | **Every intent carries four values: `fill` / `line` / `text` / `wash`**, and they are not interchangeable. | Generalizes D-20 into a rule rather than a set of exceptions. `fill` used as type is the single most likely way to break the system, so the naming makes the mistake visible. | S5 |
| D-26 | **Provenance row is a component, not a screen.** Four parts, fixed order: confidence dot · value · source citation · action. Used for parsed project fields, parsed sub quotes, proposed packages, and spec references. | The trust mechanism has to look identical everywhere or the user learns it four times. Promoting it from a screen layout to a component is what makes that guaranteed. | S5 |
| D-27 | **Confidence thresholds fixed at 0.90 / 0.70** system-wide. | The dot must mean the same thing on a parsed date as on a parsed sub quote. | S5 |
| D-28 | **Shadows are warm-tinted** (rgb 14 31 39), never neutral grey. **Row state is carried on the left edge**, not by filling the row. | A cool shadow on floral white reads as dirt. Row fills fight the numbers, which are the thing being read in a bid tab. | S5 |
| D-17 | **`_PROJECT_BRIEF.md` is a first-class generated artifact**, not an export. Auto-regenerated from confirmed fields, versioned, written to `01`. Contains project summary, key dates, requirements, identified work packages, and notes — deliberately readable by other apps and by a person with no access to Platter. | Requested explicitly in the file structure. Also the cheapest possible hedge: if Platter is ever abandoned, the parse work survives as plain markdown. | S3 |

---

## 2. Recommendations pending owner approval

| # | Recommendation | Why it matters |
|---|---|---|
| R-01 | **Model the data before drawing the wireframes.** The `scope_line_item` is the atom that connects scope → ITB → planroom → bid tab → budget → subcontract → submittal. Get that one entity right and six workflows fall out of it; get it wrong and every screen fights the schema. | Highest-leverage hour in the entire build. |
| R-02 | **Step 3 should not be stateless.** Build the click-through prototype on real Postgres + seeded demo data from day one (Railway gives you the DB free alongside the app). A stateless prototype of a data-shaped product validates pixels and hides the actual risk. | Bid leveling, budget revisions, and scope roll-up cannot be faked convincingly, and faking them teaches you nothing. |
| R-03 | **Cut the phase-1 scope to one vertical slice:** Project → Scope → ITB → Planroom → Bid Tab → Budget. Defer subcontracts, submittals, documents, templates, and intelligence to phase 2. | That slice is the only closed loop that produces value on its own. The others are downstream of a bid you haven't received yet. |
| R-04 | **Treat the sub-facing planroom as a separate app** with its own auth (magic link, no password, no account creation) and its own visual register. | It's the only surface external users touch, it's where adoption dies, and it should never share a session model with the internal tool. |
| R-05 | **Build a command registry on day one.** Every action in the app registers `{id, label, keywords, scope, run()}`; the command bar, right-click menus, and keyboard shortcuts all read from it. | The `/` bar is the app's best differentiator. Bolted on at the end it covers 20% of actions; built in from the start it covers 100% for near-zero marginal cost. |
| R-06 | **Every AI-parsed field carries a confidence score and a source citation** (file + page/sheet + bbox). Clicking a parsed date opens the PDF at that page with the region highlighted. | Parsing will be wrong sometimes. The interface's job is to make verification a two-second glance instead of a document hunt. This is the trust mechanism for the whole draft-project workflow. |
| R-07 | **Put `external_ids` (Procore, SharePoint, Dropbox) on every entity from schema v1**, even while unused. | Keeps step 7 from becoming a migration. Costs one nullable JSON column. |
| R-08 | **Command bar is desktop-only per the roadmap; iPad needs an equivalent.** Proposal: a persistent floating action glyph bottom-right that opens the same registry as a sheet. | Roadmap requires strong iPad usability; `/` has no keyboard on touch. |

---

## 2b. Staged edits — apply at start of Batch 3

Not yet applied. Owner instruction, S7.

| # | Change | Notes |
|---|---|---|
| E-01 | **Remove the source text label from the project card footer.** Drop "Proposed budget · deep parse" / "· budget table" wording entirely. | Supersedes the text-label half of D-31. |
| E-02 | **Encode budget source in color instead:** cerulean (blue) = AI-generated, sea green = verified against the budget table currently in work. | Fits existing semantics without adding vocabulary — D-19 already assigns cerulean to data and sea green to confirmed. No new color, no legend to learn. |
| E-03 | Confidence ladder collapses from four states to two. The "leveled" and "contract value" distinctions come off the card. | Open question for Batch 5: whether the budget tool still needs to track all four internally, or whether two is the real model. Flagging rather than deciding. |

| E-04 | **Add a "Schedule required" flag.** Grapefruit intent, same family as Bond and Mandatory walk — it's a bid submission requirement. | Parse should detect preliminary/CPM schedule submission requirements from Div 01 32 00 and the ITB. |
| E-05 | **Flags become a controlled vocabulary, editable only in Settings.** The card's tag popover can apply and remove flags from the library; it cannot create new ones. Replace "＋ New flag…" with "Manage flags in Settings ↗". | Prevents the same requirement existing as "Bond 100%", "bond 100", and "100% Bond" across projects — which would silently break filtering, reporting, and any cross-project analysis of historical data. |
| E-06 | **Settings gains a Flags panel:** label, intent color, description, optional parse keywords, usage count, merge/rename. Renaming a flag updates it everywhere; deleting requires reassignment if in use. | Sits alongside the trades / tags / bid package templates already specified in the roadmap's Settings section. |
| E-07 | **Parse can only propose flags that already exist in the library.** A detected requirement with no matching flag surfaces as an unmatched item on the draft project, with a one-click path to create it in Settings. | Keeps the vocabulary closed without letting the parse silently drop a real requirement. |

Applies to: Batch 2 card footer and tag editor (2.1, 2.2, 2.3), Batch 1 parse review (1.3 packages/requirements), Settings panel in Batch 6.

| E-08 | **Fix annotation pin collision in 2.2.** Pins at `left:-9px` land inside the card and sit on top of the project name. Give the anatomy grid a left gutter and place pins in it, or move them to the card's top-right corner clear of content. | Visible defect in the current file — pins overlap "Marion Transit Hub", "Belleview Fire Station 3", "Citra Elementary Addition". |
| E-09 | **Fix the footer render.** Root cause: `.pc` has no `overflow:hidden`, so `.pc__ft`'s sand fill and its own corner radius fight the card's 16px rounded corner and 1px border — the fill bleeds past the curve. Fix: put `overflow:hidden` on `.pc`, drop the footer's own `border-radius` entirely, and remove the `padding-box` gradient hack on the draft variant which compounds it. Also pin the footer down: `.pc` becomes `display:flex; flex-direction:column`, content block gets `margin-block-end:auto`. | Owner-identified. Two problems in one place — the corner bleed is the visible defect, the unpinned footer is why the row reads ragged. |
| E-10 | **Add padding beneath the dates.** `.pc__dates` currently has `margin:14px 0 0` and no bottom space, so with no glyph band between them the footer butts directly against the date values. Give the date block `padding-bottom:18px`. Separately, make it a fixed 4-column grid rather than flex, so slots hold position whether or not they're populated. | Owner-identified. The flex stretch is a second issue in the same block: Marion and Belleview show one date spanning the full card width, and column positions don't align across cards — which defeats scanning a grid. |
| E-11 | **Anatomy cards in 2.2 carry the glyph band** like every other card. | Currently omitted, which makes 2.2 look like a different component than 2.1 and 2.3. |
| E-12 | **Annotation list must not orphan an item.** Three annotations across two columns leaves one stranded — balance the split or use a single column below a certain width. | Cosmetic but it reads as broken. |

Applies to: Batch 2 card component and 2.2 layout. E-09 and E-10 are component-level and carry into every later batch.

**E-13 → E-19 — abandoned, S8.** The S7 changelog recorded these as staged (privacy/redaction requirements and the `YY-###` project number format) but the entries themselves were never written into this table, in either this file or the owner's separate export of it. The original chat where they were dictated is not reachable from this session. Owner elected to drop them rather than reconstruct — **the field-level privacy/redaction model is therefore still undefined**, despite being referenced as if settled by E-21 (blanket privacy default), E-22/E-23 (copy respecting classification), and the README. Any Batch 3+ screen that would show a lock/redaction affordance should treat it as an open question, not an assumption, until specced.

| E-20 | **Flag intent color is derived from a flag type** — `requirement` / `informational` / `risk` — not chosen per flag. | Resolves the S7 open question. Keeps color meaning stable regardless of who creates the flag. |
| E-22 | **Every value in the project info page is copyable two ways:** a copy glyph revealed on row hover (always in the same slot, so its position is learnable), and a right-click menu offering copy value / copy label + value / copy as row. Confirmation is a brief inline state change on the glyph, not a toast. | Estimators retype project numbers, addresses and dates into Procore, email, and spreadsheets constantly. Toasts for something this frequent become noise. |
| E-23 | **Copy respects privacy classification.** A locked field's copy glyph is disabled while presentation mode is on, and multi-field copy omits private values entirely rather than copying redaction placeholders. | Otherwise redaction is defeated by the copy path — the most likely way a private number reaches a sub is pasted into an email, not shown on screen. |
| E-24 | **Export to XLSX on the project info page.** Exports the confirmed field set with labels, values, source citation, and confidence. Two scopes offered: full export, and public-only (respects classification). Writes to `04_LEMA Working Files` and offers download. | Complements `_PROJECT_BRIEF.md` (D-17) rather than duplicating it — the brief is for reading, the XLSX is for pasting into other systems and for handing to someone who works in spreadsheets. |
| E-25 | **Row hover reveals actions in a fixed right-hand slot** — copy glyph, lock toggle, source citation link. The slot is reserved at rest so rows never reflow on hover. | Same principle as E-16. A row that shifts when you approach it is hard to click and reads as unstable. |
| E-26 | **Cool the surface layering.** Retire Sand `#F6EBD8`. New neutrals derived from cerulean at very low saturation so the system stays on one hue family: page `#F3F5F6`, raised `#FFFFFF`, inset `#E7ECEE`, hairline greys unchanged in alpha. Floral White is retained only as the planroom / document-sheet surface, where warmth reads as paper. | Warm surfaces were muting the orange — a warm accent on a warm ground has nowhere to stand out. Cooling the layering is the single biggest lever on making apricot pop, and it makes white-on-grey elevation legible, which cream never did well. |
| E-27 | **Add `--accent-strong: #FF9F1C`** — a deeper, more saturated orange in the same family — used for high-emphasis selection, the active command bar, focus rings, and the logo's lifted cell. `#FFCB77` demotes to `--accent-fill` for washes and large surfaces. **Hex confirmed by owner, S8.** | Owner wants the orange to carry more. `#FFCB77` is pale enough that at chip scale it reads as beige. Two steps gives punch where it's small and softness where it's large. |
| E-28 | **Bump the type scale one step.** Body 15 → 16, bodySm 13.5 → 14, data 13.5 → 14, caption 11.5 → 12, label 9.5 → 10.5. Display sizes up proportionally. Line heights unchanged. | Owner-requested. Also improves the iPad-in-daylight case. |
| E-29 | **Chips and status pills move from JetBrains Mono to Archivo at condensed width** (wdth ~85, weight 600, 11px, tracking +0.07em, uppercase), with pill padding widened to 6px/13px. | Mono at 9.5px uppercase is the worst case for legibility — uniform widths, no ascender or descender cues, tight counters. Archivo is variable with a width axis, so the condensed cut costs no extra font load. It's also semantically right: a chip is a **label**, not data. Mono stays for anything that is genuinely data — codes, money, dates, confidence scores. |
| E-30 | **Audit chip contrast after E-26/E-27.** The `*-text` shades were tuned against Floral White; re-verify each at 4.5:1 against the new cool greys and darken where needed. | Changing the ground invalidates the contrast work in D-20. This is a check, not a guess. |
| E-21 | **Projects carry a blanket privacy default set at creation** (e.g. public bid vs confidential negotiated work), which seeds every field's classification. Per-field locks still override. | Resolves the S8 open question. Default-plus-override beats per-field-only: a confidential job shouldn't require locking thirty fields by hand. |

## 2c. Staged edits — applied to Batch 4, S10

| # | Change | Notes |
|---|---|---|
| E-31 | **All planroom draft state persists server-side, keyed to the invitation token, never to the browser tab.** Quote pricing, sub-added lines, RFI drafts, and prequal edits all autosave; a sub who closes the tab mid-bid gets everything back by reopening the same magic link. | Owner: "make sure all the work the contractor completes stays populated even if they close the tab." The magic-link session has no account (D-10), so the invitation token is the only durable handle a sub has — nothing can be trusted to survive tab-local only. |
| E-32 | **Post-bid feedback now runs both directions.** The existing sub-rates-the-bidding-experience flow (star rating) stays as-is. Added: a separate "Request feedback on our bid" action so a sub can ask LEMA how their number compared. | Owner clarified "feedback requested" meant subs requesting *LEMA's* feedback on their bid, not just LEMA collecting feedback from subs — two different asks that 4.9's first draft had conflated into one. |
| E-33 | **A sub can add their own inclusion/exclusion lines to the quote entry table** when their scope genuinely differs from what LEMA identified. Always rendered with a `Sub-added · differs from scope` flag — never blended silently into the priced total. | Owner: subs sometimes carry scope the GC's takeoff missed, or exclude something the GC assumed included. New obligation for Batch 5: a sub-added line has no matching `scope_line_item_id`, so the bid tab's leveling grid needs a distinct rendering path for a priced line that doesn't map back to a GC-authored scope row. |

---

## 3. Open questions

| # | Question | Status |
|---|---|---|
| Q-01 | What must the prototype prove first? | **Answered S2 → D-07** |
| Q-02 | Who uses the internal side? | **Answered S2 → D-09** |
| Q-03 | Step 3: stateless or real DB? | **Answered S2 → D-08** |
| Q-04 | Typical package count per job? | **Assumed:** design for 15–25 typical, 60 max. Confirm if wrong. |
| Q-05 | How many active projects at once, and how many historical projects exist for the data-analysis goal? | Open — blocks seed data selection |
| Q-06 | Is Consight import required for rev 1? What's its export format? | Open — deferred to batch 5 |
| Q-07 | CSI 2026 vs 16-division storage? | **Decided S2 → D-11** |
| Q-08 | Email provider, and must ITB send from a LEMA domain? | **Answered S3 → D-14** |
| Q-09 | Can subs see each other, or fully siloed per invitee? | **Assumed:** siloed. Addenda board shows trade-scoped and all-sub messages, never other bidders' identities. |
| Q-10 | `./FILESTRUCTURE` referenced but not provided. | **Answered S3 → D-15, D-16, D-17** |
| Q-11 | Light, dark, or both? | **Decided S2 → D-12** |
| Q-12 | LEMA brand constraints for outbound documents? | Open — phase 2 |
| Q-13 | Which historical project should seed the database? | **In progress** — owner retrieving from another server |
| Q-14 | Does the estimating mailbox need to *receive* as well as send — should sub replies and emailed quotes be ingested back into Platter? | Open — changes Graph scope from `Mail.Send` to `Mail.ReadWrite` |
| Q-15 | Is the SharePoint tree per-project under one site, or one site per project? Affects folder provisioning and permissions. | Open |

---

## 4. Session changelog

### S1 — 2026-08-15 · Discovery & identity
- Read `PLATTER_APP.md` in full.
- Produced identity rev 0: glyph mark, palette, type system, applied project card.
- Logged D-01 → D-06, R-01 → R-08, Q-01 → Q-12.
- Next: answers to Q-01/02/03, then begin Step 1 (wireframes), starting with the data model sketch and the Dashboard + Project Card screens.

### S2 — 2026-08-15 · Priorities set, Step 1 planned
- Owner answered Q-01/02/03. Logged D-07 → D-13. Self-resolved Q-04, Q-07, Q-09, Q-11.
- Build order rewritten around parsing-first: intake + parse review becomes wireframe batch 1, dashboard drops to batch 2.
- Produced `STEP1_PLAN.md` — core data model and the full wireframe index (5 batches, ~40 screens/states).
- Next: owner approves the wireframe index, then batch 1 is drawn.

### S3 — 2026-08-15 · File structure, email, Batch 1 drawn
- Owner supplied `FILESTRUCTURE.md` and confirmed Outlook/M365 as the eventual sending path.
- Logged D-14 → D-17. Closed Q-08 and Q-10. Opened Q-14, Q-15.
- Key reframe: the file structure is a **write-back contract**. Platter owes SharePoint a generated brief, a leveling sheet, package folders, revision naming, and PDF conversion.
- Delivered **Batch 1 wireframes** (screens 1.1–1.5, 22 states) as an interactive annotated document.
- Next: owner reviews Batch 1, then Batch 2 (dashboard, card anatomy, command bar).

### S4 — 2026-08-15 · Palette change, rounder geometry
- Owner approved Batch 1 and supplied a new palette; asked for more rounded styling.
- Logged D-18 → D-23. Superseded D-02 and the radius half of D-06.
- Re-skinned identity sheet, logo, and all Batch 1 wireframes to Cerulean & Apricot at the new radius scale.
- Structure, states, annotations and information design of Batch 1 are unchanged — this was purely a skin pass.
- Next: Batch 2 — dashboard grid, project card anatomy (8 states), top nav, command bar.

### S5 — 2026-08-15 · Design system v1.0
- Built the design system: token architecture, 20 components with states, patterns, accessibility floor.
- Delivered `platter-design-system.html` (living reference), `platter-tokens.css`, `platter-tokens.json` (Figma/Tailwind portable).
- Logged D-24 → D-28.
- Open: whether refinement happens in Figma (tokens can be imported as variables and components rebuilt via the Figma connector) or directly in HTML.
- Next: Batch 2 wireframes, now drawn from real system components rather than one-off markup.

### S6 — 2026-08-15 · Batch 2 wireframes
- Delivered `platter-wireframes-batch2.html` — 5 screens, 21 states, built from design system components.
- Caught three roadmap details Batch 1 had missed: centered nav logo, glyphs-only card band, proposed-budget footer.
- Logged D-29 → D-37.
- New obligations created: a single commissioned icon set (D-30), budget tool must emit the four footer source states (D-31), command registry now load-bearing for three surfaces.
- Next: Batch 3 — project workspace, scope tool with its three workflows, scope worksheet.

### S7 — 2026-08-15 · Staged feedback
- Owner staged E-01 → E-03 against the card budget footer. Not applied; to be executed at the start of Batch 3.
- Owner added E-04 → E-07: Schedule required flag, and flags as a Settings-managed controlled vocabulary.
- Owner flagged layout defects in 2.2 via screenshot. Staged E-08 → E-12; E-09 and E-10 are component-level fixes affecting all future batches.
- Owner added privacy/redaction requirements and the `YY-###` project number format. Staged E-13 → E-19.
- Owner clarified the 2.2 defect: the footer render and missing padding under the dates specifically. E-09 and E-10 rewritten with root causes.
- Owner approved all staged items and both open questions → E-20, E-21.
- Owner added copy-to-clipboard and XLSX export on the project info page. Staged E-22 → E-25.
- Owner requested cooler surface layering, stronger orange, larger type, and more legible chips. Staged E-26 → E-30.
- **Session closing.** All 30 edits staged and unapplied. Next chat opens by applying E-01 → E-30, then drawing Batch 3.

### S8 — 2026-08-15 · Resuming for Batch 3
- Re-established context by cloning the repo and re-reading `DECISION_LOG.md`, `HANDOFF.md`, `STEP1_PLAN.md`, and the current token files.
- Confirmed **E-27 hex `#FF9F1C`** — no change.
- **E-13 → E-19 abandoned** — never written into §2b despite S7 claiming they were staged; unrecoverable from this session; owner chose to drop rather than re-dictate. Privacy/redaction model remains an open question (see note above E-20).
- Confirmed sequencing: apply all remaining staged edits (E-01 → E-12, E-20 → E-30) first, regenerating tokens/system/Batches 1–2, **then** draw Batch 3.
- **Applied E-01 → E-12 and E-20 → E-30.** `tokens.css`/`.json` updated (cool page/paper surface split, `--accent-strong`, one-step type bump, condensed-Archivo chip tokens, E-30 contrast re-audit — all four intents still clear 4.5:1). `design-system.html`, `identity.html`, and `mark.svg` regenerated against the new tokens. Batch 1 (`batch-1-intake-parse.html`) fully migrated off `legacy-aliases.css` onto `tokens.css` directly — the file is now deleted, nothing references it. Batch 2 (`batch-2-dashboard-shell.html`) got the card component fixes (`.pc` overflow:hidden + flex column + `margin-block-start:auto` footer pin, fixed 4-column dates grid, dates padding, is-draft gradient hack removed), the 2.2 anatomy set gained its glyph band (E-11), pin collisions fixed by moving to a top-right inset rather than a negative offset (E-08, and extended to the 2.1 pins since the new `overflow:hidden` would have clipped them), and the annotation list orphan fixed by merging to one column (E-12). Card footers across both batches lost their source-text label and gained source-encoded color (E-01/E-02/E-03: cerulean = AI-generated, sea green = verified — the four-state ladder collapses to two on the card, Batch 5 open question on whether the budget tool still tracks all four internally). Flags: "Schedule required" added (E-04) and demonstrated in both batches' parse/tag-editor UI; "+ New flag…" replaced with "Manage flags in Settings ↗" (E-05); an unmatched-flag state added to Batch 1's parse review demonstrating E-07.
- **Scope note:** the exhaustive per-inline-style sweep of every ad hoc pixel value in Batch 1/2 (values that don't exactly match one of the five E-28 token sizes) was not attempted — diminishing returns on a few hundred scattered instances. The named tokens, chips, card component, and surfaces are fully migrated; anything cosmetic beyond that is unaudited.
- **Delivered Batch 3 wireframes** — `batch-3-project-workspace.html`, 7 screens, 23 states, built directly against v1.1 tokens (no legacy-alias debt to carry forward). Screens: 3.1 project dashboard (full nav · iPad glyph-cloud collapse · mini map/renderings · full timeline · edit history), 3.2 quick action popover (menu · inline log comm · inline add sub), 3.3 workflow chooser (deep parse / spec-driven / manual, deep parse pre-selected per D-07), 3.4 deep AI parse (running · proposed packages with budget+schedule · accept/reject), 3.5 spec-driven (spec index selection · package proposal · requirement fill via the provenance row), 3.6 manual (drawing-region selection populating the worksheet inline), 3.7 scope worksheet (table · line item editor · all 7 kind badges · long-lead left-edge flag · empty-package state, no dead end).
- New obligations this batch creates: kind badges (inclusion/exclusion/alternate/allowance/unit price/clarification/VA option) are now a fixed vocabulary the Batch 5 bid tab and budget have to render; the provenance row (D-26) has a third shape (parsed scope lines, alongside parsed project fields and parsed sub quotes); exclusion cross-referencing (an excluded line pointing at the package that owns that scope) is new and Batch 5 needs to resolve it, not just display it.
- Every screen in 3.1–3.7 reuses existing components only (`.pc` card, `.chip`/`.st`, `.prov` provenance row, `.tbl` table) plus new ones scoped to this batch (`.kb` kind badges, `.wcard` workflow chooser, `.tl` timeline, project-scoped `.pnav`) — no new color was introduced; kind badges reuse D-19's existing four intents.
- Next: owner review of Batch 3, then Batch 4 — ITB & sub-facing planroom (priority #2).

### S9 — 2026-08-15 · Batch 4 drawn, GitHub issue tracking established
- Owner approved Batch 3 with no comments. Resuming per `HANDOFF.md`'s prompt.
- **Delivered Batch 4 wireframes** — `batch-4-itb-planroom.html`, 10 screens, 32 states. Screens 4.1–4.2 (ITB tool, invite composer) are internal, reusing the Batch 3 `.topnav`/`.pnav`/`.wshell` chrome unchanged. Screens 4.3–4.10 (planroom landing, scope, documents, addenda, submit quote, RFI, prequal, no-bid) introduce the planroom's own visual register per R-04/D-10: paper surface (`--bg-surface-paper`), a lightweight non-shell header (`.plm-hdr`) with a monochrome mark, a persistent magic-link disclosure, and a horizontal section nav (`.plm-tabs`) in place of the internal dark sidebar — no account menu, no internal nav items (Network/Data/Tools/Settings).
- New obligations this batch creates: addenda acknowledgment becomes a hard gate on quote submission (`bid.addenda_acked[]` now demonstrated end-to-end, 4.6→4.7); parsed sub quotes reuse the provenance mechanic (`bid_line.source='parsed'`), same shape as intake and internal parsing; the countdown chip is the one component explicitly shared across the internal/planroom register boundary, urgent-under-48h per D-32.
- **Confirmed the E-13→E-19 gap stays open, deliberately.** 4.4's "other scopes collapsed" implements only the package-level siloing already answered by Q-09 — it is explicitly annotated as not a stand-in for the abandoned field-level privacy/redaction model. Flagged in the batch's intro callout and its closing "what this commits us to" note so Batch 5 (bid tab, where a sub's real price sits next to a plug) doesn't inherit the assumption that privacy is solved.
- Verified in-browser: internal chrome renders identically to Batch 3, planroom register renders visually distinct (paper ground, no dark shell), tab-switching script works across both registers, no console errors from the page itself.
- **GitHub issue tracking established.** Owner set up `hcobuilders/platter_app` for issue tracking but no issues or templates existed yet (checked via `gh issue list --state all` → empty, no `.github/ISSUE_TEMPLATE`). Owner chose: design a template from the existing E-## convention, backfill E-01→E-30 as closed issues, open new ones going forward. Template: title `E-## — <change>`, body sections Change / Rationale / Applies to / Status, labeled `enhancement` + a `batch-N` label per the batch it applies to.
- Next: owner review of Batch 4, then Batch 5 — bid tab & budget. Bid tab is the first screen where the open privacy question (E-13→E-19) becomes load-bearing rather than deferrable — flag before drawing.

### S10 — 2026-08-15 · Batch 4 feedback applied (E-31 → E-33)
- Owner reviewed Batch 4 same session, no other comments — praised the batch overall and gave three edits.
- **Logged and applied E-31 → E-33** directly to `batch-4-itb-planroom.html` (see §2c) since all three were easy fixes within the existing screens, per owner instruction: "if you can easily fix or close them do so."
  - E-31: added a visible autosave indicator to 4.7's entry table and brief autosave notes to 4.8 (RFI) and 4.9 (prequal full form); annotation copy updated to state the persistence guarantee explicitly.
  - E-32: 4.9's post-bid screen (i3) now has two sections — the existing star-rating sub→LEMA feedback, plus a new "Request feedback on our bid" action for LEMA→sub feedback. Annotation rewritten to explain both directions.
  - E-33: 4.7's entry table gained two example sub-added rows (one inclusion, one exclusion), each carrying a `Sub-added · differs from scope` chip; the "add line" affordance copy was broadened accordingly. Flagged as a new Batch 5 obligation in the batch's closing callout — sub-added lines have no matching `scope_line_item_id`.
- Verified all three changes landed in the DOM (`textContent` checks for each new string, 3 occurrences of the sub-added flag as expected: 2 table rows + 1 callout mention) and that no console errors were introduced.
- **GitHub:** opened E-31, E-32, E-33 on `hcobuilders/platter_app` following the S9 template, then closed all three as completed since they were implemented in the same turn.
- Also surfaced and resolved a false alarm: owner reported "not rendering correctly" after the Batch 4 delivery. Root cause was the review tool's own preview pane loading the file as a `data:` URL snapshot (files outside its recognized project root render that way), which breaks the relative `../tokens/tokens.css` link — not a defect in the shipped file. Noted for future sessions: don't chase phantom rendering bugs without first checking whether the viewer loaded the file as `file://` vs. a `data:` URL snapshot.
- Next: Batch 5 — bid tab & budget. Same flag as S9 carries forward: this is where the undefined privacy model (E-13→E-19) and the new sub-added-line rendering path (E-33) both become load-bearing.
