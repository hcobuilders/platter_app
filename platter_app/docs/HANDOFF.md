# Platter — Handoff to next chat

Paste this as the first message in the new chat, with `DECISION_LOG.md` attached.

---

## Prompt to paste

> Continuing the Platter build. Read `DECISION_LOG.md` for full context — 45 locked decisions (D-01 → D-45), 40 applied staged edits (E-01 → E-40 with a gap at E-13 → E-19, dropped), and no open questions (Q-01 → Q-16 all resolved).
>
> **Step 1 (wireframes) and Step 2 (owner approval) are both closed as of S15.** All 6 batches / 40 screens / 134 states are approved, with two self-review fixes (E-39/E-40) applied to Batch 5 as part of closing Step 2.
>
> **Step 3 is next: the interactive click-through prototype on real Postgres** (D-08/R-02), scoped to the phase-1 vertical slice (R-03): Project → Scope → ITB → Planroom → Bid Tab → Budget. This is a different kind of work — a real build, not another wireframe batch or a review pass.
>
> 1. If the owner is bringing new feedback on any batch, stage it the same way every prior round was handled — apply it directly if easy, log it as the next E-## number, open+close a GitHub issue for it.
> 2. If the owner says to proceed with Step 3, start from the data model in `STEP1_PLAN.md` Part A and the component/token system in `design/system/design-system.html` — don't re-derive either from scratch.
> 3. Keep updating `DECISION_LOG.md` as we go, same convention as the last fifteen sessions.
> 4. **GitHub issue tracking is live** on `hcobuilders/platter_app` — new E-## edits get opened as issues using the S9 template (title `E-## — <change>`, body: Change / Rationale / Applies to / Status; labels `enhancement` + `batch-N`), closed immediately if implemented same-session. Locked decisions (D-##) don't get issues — only staged E-## edits do.
>
> One small open item carried into Step 3, not blocking: E-40 flagged a Settings panel for change-log tags (Buyout/Scope change/Unit cost update) that's referenced but not yet wireframed — draw it if Step 3 needs it, otherwise it can wait.

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
| `design/wireframes/batch-6-settings.html` | Settings — 6 screens, 15 states |

**Schedule position:** Step 2 of 8 (owner approval) — **complete** as of S15. Step 3 (interactive build on real Postgres) is next; Steps 4–8 (Railway deploy → integrations) not started.

**GitHub:** `hcobuilders/platter_app`, current branch tracks E-## edits as closed issues per the S9 template.

**Build decisions already made:** Postgres + seeded real project from day one (D-08), seeded as "West Henry Logistics" 26-085 (D-44); 3 users, no RBAC (D-09); Microsoft Graph for email behind a `Mailer` interface (D-14); SharePoint one shared site, per-project folders, treated as a write-back contract (D-15/D-45); command registry built first as it now serves three surfaces (R-05, D-36); lifecycle cost is scenario-based, `lifecycle_scenario` not a flat line (D-43).

---

## The four ideas everything else hangs on

1. **`scope_line_item` is the atom.** Each sub's price attaches to a shared line id, so bid leveling stops being a mapping exercise — gaps are lines with no bid, plugs are a bid line tagged `source = plug`.
2. **Provenance is the trust mechanism.** Every AI-derived value carries confidence + document + page + bbox. Clicking it opens the source page with the region highlighted. It's a component, not a screen, so it looks identical everywhere — proven across project fields, scope lines, sub quotes, spec references, and lifecycle-cost research by the end of Batch 5.
3. **Semantic color, not decorative.** Orange = selection (`accent-strong` for high-emphasis, E-27), cerulean = data / estimate-derived, sea green = confirmed / verified, grapefruit = flags. This is the system a S15 review caught actually inverted on two rows of the budget table (E-39) — worth remembering it's easy to get backwards when a screen has two states that both "look done."
4. **One privacy model — still undefined.** Field-level classification (E-13 → E-19) was never recovered and was dropped (S8). Batch 5's presentation-mode toggle (D-38) is a narrow, explicit stand-in for the one place it became load-bearing (a sub's real price next to a plug) — not a general solution. Don't assume it's built anywhere else.

---

## E-13 → E-19: dropped, not applied

The S7 session changelog in `DECISION_LOG.md` claimed E-13 → E-19 were staged (privacy/redaction requirements, the `YY-###` project number format), but the actual entries were never written into §2b — the table jumps from E-12 to E-20. This was discovered in S8, along with a byte-identical re-export the owner had of the same incomplete file. The original chat where they'd have been dictated wasn't reachable. The owner chose to drop them rather than reconstruct from scratch.

**Practical effect:** anything that reads as "privacy classification exists" in the decision log (E-21's blanket default, E-22/E-23's copy-respects-classification) is aspirational, not implemented. If Step 3 needs field-level privacy for real, that's new design work, not a lookup.

---

## Open questions

None outstanding — Q-01 → Q-16 are all answered (see `DECISION_LOG.md` §3). Deliberately deferred to phase 2, not open: full dark mode (D-12), LEMA brand constraints for outbound documents (Q-12), Consight import (Q-06).
