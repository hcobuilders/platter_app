# Platter

Preconstruction command center for LEMA. Projects, scope, ITB, subcontractor planroom, bid leveling, budget.

**Status:** Step 3 of 8 — a working interactive prototype is live at **[platter.studio](https://platter.studio)**. All six vertical-slice workflows (Project, Scope, ITB, Planroom, Bid Tab, Budget) plus Settings run against real Postgres, closed loop proven end to end (a real Planroom quote submission flows straight into the internal Bid Tab). AI parsing and email sending are stubbed by design — see `docs/DECISION_LOG.md` S17.

---

## Start here

| Read this | For |
|---|---|
| [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md) | **Source of truth.** 37 locked decisions, 30 staged-but-unapplied edits, open questions, session history. |
| [`docs/STEP1_PLAN.md`](docs/STEP1_PLAN.md) | Data model and the full wireframe index across all six batches. |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | Where the work stopped and what happens next. |

Open the HTML files directly in a browser — no build step.

```
design/
  tokens/
    tokens.css          ← single source of truth for all design values (v1.1)
    tokens.json         ← same tokens, portable to Figma variables / Tailwind
  identity/             ← logo, palette, type, radius scale
  system/               ← living component reference, 20 components
  wireframes/           ← annotated wireframes, one file per batch (all 6 drawn and approved)
docs/                   ← decisions, plan, handoff
```

---

## Next task

**Owner testing and iteration** on the live prototype at [platter.studio](https://platter.studio). The app lives in `/app` (Next.js + Prisma 7 on Railway Postgres) — see `app/README.md` for local dev setup.

What's built (all real, verified against the database, not fixtures):
- Dashboard, project overview, scope worksheet (full CRUD)
- Bid Tab — comparison grid, gap/plug, sub-added disposition queue
- Budget table + revisions
- ITB tool (send stubbed)
- Planroom — magic-link, sub-facing, real quote submission
- Settings — Flags/Trades/Tags CRUD

What's deliberately not built yet:
- AI document parsing (stubbed per owner decision, S17)
- Real email sending (stubbed per owner decision, S17)
- Package templates, Appearance/Profile/Connected-accounts settings screens
- Any auth gate on the internal side (matches D-09 — 3 users, no RBAC — but means no login exists yet)
- **E-13 → E-19 (privacy/redaction requirements)** were never recovered and were dropped rather than reconstructed (S8). Field-level privacy/redaction is **undefined**, not implemented.

---

## Four ideas everything hangs on

1. **`scope_line_item` is the atom.** Each sub's price attaches to a shared line id, so bid leveling stops being a mapping exercise — scope gaps are lines with no bid against them, plugs are a bid line tagged `source = plug`.
2. **Provenance is the trust mechanism.** Every AI-derived value carries confidence, document, page and bounding box. Clicking it opens the source at that page with the region highlighted. It is a component, not a screen, so it looks identical everywhere.
3. **Color is semantic, never decorative.** Orange means selection. Cerulean means data. Sea green means confirmed. Grapefruit means flagged. The palette has changed twice without invalidating a single wireframe, because meaning was assigned rather than color.
4. **One privacy model.** Field-level classification drives both screen-share redaction and what a subcontractor sees in the planroom — two behaviors, one list.

---

## Working rules

- Components reference **semantic tokens only**. A raw hex inside a component is a bug; if you need one, the token set is missing something.
- Every number in the interface is monospaced and tabular. Column alignment is a correctness feature in estimating.
- Every component defines hover, focus, disabled, loading, empty and error before it ships. The skipped states are always the ones that break.
- Log every decision in `DECISION_LOG.md` with its rationale, including the ones that get superseded.
