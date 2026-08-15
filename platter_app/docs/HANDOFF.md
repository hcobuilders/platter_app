# Platter — Handoff to next chat

Paste this as the first message in the new chat, with `DECISION_LOG.md` attached.

---

## Prompt to paste

> Continuing the Platter build. Read `DECISION_LOG.md` for full context — 37 locked decisions (D-01 → D-37) and 30 staged edits (E-01 → E-30) that have **not** been applied yet.
>
> Do these in order:
>
> 1. **Apply all 30 staged edits.** Most are visual-system changes (cooler grey/white surface layering, stronger orange accent, one-step type bump, chips moved to condensed Archivo) plus component fixes to the project card (footer render, date padding, fixed 4-column date grid, pinned footer). Regenerate the design system, tokens, and Batches 1 and 2 against them.
> 2. **Draw Batch 3** per the index in `STEP1_PLAN.md`: project workspace, the three scope-building workflows, and the scope worksheet.
> 3. Keep updating `DECISION_LOG.md` as we go.
>
> Two things I owe you an answer on — ask me at the start:
> - Confirm `#FF9F1C` as the new strong orange (E-27), or give me a different hex.
> - Which historical project seeds the database (Q-13).

---

## Current state

**Delivered and current**
| File | What it is |
|---|---|
| `DECISION_LOG.md` | Locked decisions, staged edits, open questions, session log. The source of truth. |
| `STEP1_PLAN.md` | Data model + full wireframe index, batches 1–6 |
| `platter-design-system.html` | Living component reference, 20 components |
| `platter-tokens.css` / `.json` | Portable tokens (Figma variables / Tailwind) |
| `platter-identity.html` | Logo, palette, type, radius scale |
| `platter-mark.svg` | Standalone glyph |
| `platter-wireframes-batch1.html` | Intake & parse review — 5 screens, 22 states |
| `platter-wireframes-batch2.html` | Dashboard & shell — 5 screens, 21 states |

**Schedule position:** Step 1 of 8 (wireframes). Batches 1–2 drawn, 3–6 remaining. Steps 2–8 (approval → interactive build → Railway → integrations) not started.

**Build decisions already made:** Postgres + seeded real project from day one (D-08); 3 users, no RBAC (D-09); Microsoft Graph for email behind a `Mailer` interface (D-14); SharePoint treated as a write-back contract, not storage (D-15); command registry built first as it now serves three surfaces (R-05, D-36).

---

## The four ideas everything else hangs on

1. **`scope_line_item` is the atom.** Each sub's price attaches to a shared line id, so bid leveling stops being a mapping exercise — gaps are lines with no bid, plugs are a bid line tagged `source = plug`.
2. **Provenance is the trust mechanism.** Every AI-derived value carries confidence + document + page + bbox. Clicking it opens the source page with the region highlighted. It's a component, not a screen, so it looks identical everywhere.
3. **Semantic color, not decorative.** Orange = selection, cerulean = data, sea green = confirmed, grapefruit = flags. The palette has already changed twice without invalidating a single wireframe, because meaning was assigned rather than color.
4. **One privacy model.** Field-level classification drives both screen-share redaction and what a subcontractor sees in the planroom. Two behaviors, one list.

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
| E-27 | Confirm `#FF9F1C` as the strong orange. |
