# Platter

Preconstruction command center for LEMA. Projects, scope, ITB, subcontractor planroom, bid leveling, budget.

**Status:** Step 1 of 8 — wireframes. Batches 1–2 drawn, 3–6 remaining. No application code yet.

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
    tokens.css          ← single source of truth for all design values
    tokens.json         ← same tokens, portable to Figma variables / Tailwind
    legacy-aliases.css  ← temporary; delete per E-26→E-30 (see file header)
  identity/             ← logo, palette, type, radius scale
  system/               ← living component reference, 20 components
  wireframes/           ← annotated wireframes, one file per batch
docs/                   ← decisions, plan, handoff
```

---

## Next task

**Apply staged edits E-01 → E-30 before drawing Batch 3.** They are listed in `DECISION_LOG.md` § 2b and have not been applied to any file. They cover:

- Cooler grey/white surface layering; stronger orange accent (`#FF9F1C`, pending confirmation)
- Type scale up one step; chips move from mono to condensed Archivo
- Project card fixes: footer render, padding under dates, fixed 4-column date grid, pinned footer
- Field-level privacy classification driving both screen-share redaction and planroom visibility
- Flags as a Settings-managed controlled vocabulary
- Project number format `YY-###`

Applying E-26 → E-30 should also regenerate `identity.html` and `batch-1-intake-parse.html` against `tokens.css` directly, which is what makes `legacy-aliases.css` deletable.

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
