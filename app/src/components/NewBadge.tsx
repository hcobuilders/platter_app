// Same-color glyph used everywhere an item is "new to this user" (S-batch
// #66) — one consistent indicator app-wide rather than a bespoke badge per
// surface, since the issue explicitly calls for reusing this on budget
// items, plugs, awards, files, and addenda as those get wired up too.
export function NewBadge() {
  return <span className="dot" style={{ background: "var(--accent-fill)", flex: "none" }} title="New — not yet viewed" />;
}
