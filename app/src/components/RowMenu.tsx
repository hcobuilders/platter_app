"use client";

import { useEffect, useRef, useState } from "react";

// Per-row kebab action menu, extracted from the pattern ITB had inline so
// other tables (Bid Tab, Budget, Scope) can reuse the same trigger +
// click-outside-to-close behavior instead of hand-rolling it again.
export function RowMenu({ label = "Row actions", children }: { label?: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button className="btn btn--sm btn--gh" type="button" onClick={() => setOpen((v) => !v)} aria-label={label}>
        ⋮
      </button>
      {open && (
        <div ref={ref} className="rowmenu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
