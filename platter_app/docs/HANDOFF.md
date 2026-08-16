# Platter — Handoff to next chat

Paste this as the first message in the new chat, with `DECISION_LOG.md` attached.

---

## Prompt to paste

> Continuing the Platter build. Read `DECISION_LOG.md` for full context — 41 locked decisions (D-01 → D-41), 33 applied staged edits (E-01 → E-12, E-20 → E-33 with gaps), and one dropped group (E-13 → E-19, see below).
>
> Do this:
>
> 1. **Draw Batch 6 — Settings** per the index in `STEP1_PLAN.md` (minimal, phase 1: theme + accent, contact info & signature, OAuth connections, trades/tags/package templates). It also now owes: the Flags panel (E-06, controlled vocabulary CRUD), and per D-41's closing note, Settings should reuse 5.5's rule/custom-field pattern rather than invent a second customization UI.
> 2. Keep updating `DECISION_LOG.md` as we go, same convention as the last seven sessions.
> 3. **GitHub issue tracking is live** on `hcobuilders/platter_app` — new E-## edits get opened as issues using the template established in S9 (title `E-## — <change>`, body: Change / Rationale / Applies to / Status; labels `enhancement` + `batch-N`), and closed immediately if implemented same-session. Check current issues before creating new ones so the template stays consistent.
>
> Things carried forward, not blocking: Q-13 (which historical project seeds the Postgres database), Q-16 (lifecycle-cost table shape, new schema surface raised in Batch 5, not yet reviewed).

---

## Current state

**Delivered and current** (all against tokens v1.1 — no `legacy-aliases.css`, it's deleted)
| File | What it is |
|---|---|
| `docs/DECISION_LOG.md` | Locked decisions, staged edits, open questions, session log. The source of truth. |
| `docs/STEP1_PLAN.md` | Data model + full wireframe index, batches 1–6 |
| `design/system/design-system.html` | Living component reference, 20 components |
| `design/tokens/tokens.css` / `.json` | Portable tokens (Figma variables / Tailwind), v1.1 |
| `design/identity/identity.html` | Logo, palette, type, radius scale |
| `design/identity/mark.svg` | Standalone glyph |
| `design/wireframes/batch-1-intake-parse.html` | Intake & parse review — 5 screens, 22 states |
| `design/wireframes/batch-2-dashboard-shell.html` | Dashboard & shell — 5 screens, 21 states |
| `design/wireframes/batch-3-project-workspace.html` | Project workspace & scope — 7 screens, 23 states |
| `design/wireframes/batch-4-itb-planroom.html` | ITB & sub-facing planroom — 10 screens, 32 states |
| `design/wireframes/batch-5-bidtab-budget.html` | Bid tab & budget — 5 screens, 21 states (includes 5.5, added beyond the original plan) |

**Schedule position:** Step 1 of 8 (wireframes). Batches 1–5 drawn, 6 remaining. Steps 2–8 (approval → interactive build → Railway → integrations) not started.

**GitHub:** `hcobuilders/platter_app` (branch `Step_1_DESIGN`) now tracks E-## edits as issues — established S9, no prior issues existed to inherit a template from, so one was designed from the existing decision-log convention.

**Build decisions already made:** Postgres + seeded real project from day one (D-08); 3 users, no RBAC (D-09); Microsoft Graph for email behind a `Mailer` interface (D-14); SharePoint treated as a write-back contract, not storage (D-15); command registry built first as it now serves three surfaces (R-05, D-36).

---

## The four ideas everything else hangs on

1. **`scope_line_item` is the atom.** Each sub's price attaches to a shared line id, so bid leveling stops being a mapping exercise — gaps are lines with no bid, plugs are a bid line tagged `source = plug`.
2. **Provenance is the trust mechanism.** Every AI-derived value carries confidence + document + page + bbox. Clicking it opens the source page with the region highlighted. It's a component, not a screen, so it looks identical everywhere — now proven across three different content types (project fields, scope lines, edit history) in Batch 3.
3. **Semantic color, not decorative.** Orange = selection (with a stronger `accent-strong` variant for high-emphasis moments as of E-27), cerulean = data, sea green = confirmed, grapefruit = flags. The palette has changed twice, and the surface layering cooled once (E-26), without invalidating a single wireframe's structure — because meaning was assigned rather than color.
4. **One privacy model — still undefined.** Field-level classification was supposed to drive both screen-share redaction and what a subcontractor sees in the planroom, per E-21/E-22/E-23. **The actual spec (E-13 → E-19) was never recovered — see below.** Don't assume it's built; it isn't.

---

## E-13 → E-19: dropped, not applied

The S7 session changelog in `DECISION_LOG.md` claimed E-13 → E-19 were staged (privacy/redaction requirements, the `YY-###` project number format), but the actual entries were never written into §2b — the table jumps from E-12 to E-20. This was discovered in S8, along with a byte-identical re-export the owner had of the same incomplete file. The original chat where they'd have been dictated wasn't reachable from this session. The owner chose to drop them rather than reconstruct from scratch.

**Practical effect:** anything that reads as "privacy classification exists" in the decision log (E-21's blanket default, E-22/E-23's copy-respects-classification) is aspirational, not implemented. If a future batch needs field-level privacy (the planroom in Batch 4 is a plausible candidate, since it's the surface that decides what a sub sees), that's new design work, not a lookup.

---

## Open questions carried forward

| # | Question |
|---|---|
| Q-05 | How many active projects at once, and how many historical projects exist for the data-analysis goal? |
| Q-06 | Is Consight import required for rev 1? What format does it export? |
| Q-12 | LEMA brand constraints for outbound documents? |
| Q-13 | Which historical project seeds the database? |
| Q-14 | Does the estimating mailbox need to receive as well as send? (`Mail.Send` vs `Mail.ReadWrite`) |
| Q-15 | SharePoint: one site per project, or all projects under one site? |
