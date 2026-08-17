# platter_app
Construction app with modules to help subcontractors and GC partners connect and create advantageous and strategic partnerships maximizing revenue. App is focused on streamlining workflows, eliminating reworks by the management team, and optimizing data use and placement to deliver fast intelligent project insights and Preconstruction knowledge.

## Revision notes

Compiled from the owner's revision notes as they come in. The nav bar shows a
short build version (`v<git sha>`) so a note can be tied back to the build it
was written against.

### 2026-08-16 (7:39pm batch)
- Build version now shown in the nav bar; this changelog started.
- Every note in this batch filed as a GitHub issue for tracking, even where fixed immediately.
- "Bid bond required" reworked from a checkbox into a flag chip — click downloads the bond template, right-click removes it.
- Sub-carried bonds (P&P) moved out of the project overview and are now Bid-Tab-only, with an explicit "accept as bond alternate" action at award/reconciliation time.
- Flags on the project overview page can now be added and right-click-deleted.
- Project overview: address verification (geocoding) + a mini map.
- Project overview: new "Hot items" section — persistent, user-attributed notes with an optional associated date.
- Key dates: label casing standardized; dates now also render as a timeline graphic.
- Bid packages on the project overview are clickable through to their bid tab.
- Budget table's package pill links to that package's bid tab.
- Scope line seed data expanded.
