# Platter

Preconstruction command center for LEMA. Projects, scope, ITB, subcontractor planroom, bid leveling, budget.

**Status:** Step 2 of 8 — owner approval closed. All 6 wireframe batches (40 screens / 134 states) approved. Step 3 (interactive prototype) is next. No application code yet.

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

**Step 3 — interactive click-through prototype on real Postgres** (D-08/R-02), scoped to the phase-1 vertical slice (R-03): Project → Scope → ITB → Planroom → Bid Tab → Budget.

Step 1 (wireframes) and Step 2 (owner approval) are both closed as of S15 — see `docs/DECISION_LOG.md` for the full record. Everything staged against the wireframes (E-01 → E-40) is applied; no known defects remain in any of the 6 batches. Two things stay deliberately open into Step 3, not because they were missed:

- **E-13 → E-19 (privacy/redaction requirements) were never recovered** and were dropped rather than reconstructed (S8). Field-level privacy/redaction is **undefined**, not implemented — Batch 5's presentation-mode toggle (D-38) is a narrow, explicit stand-in, not a substitute for a real spec.
- **E-40's change-log-tags Settings panel** is a small drawn-later obligation from S15's review — noted, not yet wireframed.

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
