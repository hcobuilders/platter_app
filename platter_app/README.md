# Platter

Preconstruction command center for LEMA. Projects, scope, ITB, subcontractor planroom, bid leveling, budget.

**Status:** Step 1 of 8 — wireframes. Batches 1–3 drawn and current against v1.1 tokens, 4–6 remaining. No application code yet.

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
  wireframes/           ← annotated wireframes, one file per batch (1, 2, 3 drawn)
docs/                   ← decisions, plan, handoff
```

---

## Next task

**Batch 4 — ITB & sub-facing planroom** (priority #2 per D-07 — `STEP1_PLAN.md` §B, screens 4.1–4.10).

Staged edits E-01 → E-12 and E-20 → E-30 are applied across `tokens.css`/`.json`, `design-system.html`, `identity.html`, `mark.svg`, and Batches 1–2. `legacy-aliases.css` is gone — every file now references `tokens.css` directly. Batch 3 (project workspace + scope tool, 3.1–3.7) is drawn fresh against v1.1, no retrofit needed. What's still open:

- **E-13 → E-19 (privacy/redaction requirements, `YY-###` project number format) were never recovered.** The S7 changelog claims they were staged, but the entries were never written into `DECISION_LOG.md` §2b, and the original chat that would have them isn't reachable from this session. Owner elected to drop rather than reconstruct (S8). Treat field-level privacy/redaction as **undefined**, not implemented, despite E-21/E-22/E-23 referencing it.
- Q-13 (which historical project seeds the database) is still open — doesn't block wireframes, blocks Step 3.
- Batch 3 introduces two obligations for Batch 5 (bid tab/budget): render the seven scope-line kind badges, and resolve exclusion cross-references (where excluded scope actually landed).

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
