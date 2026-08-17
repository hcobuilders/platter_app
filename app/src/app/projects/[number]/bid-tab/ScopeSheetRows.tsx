"use client";

import { useState } from "react";

// Owner's reference screenshot (S-batch #70) shows the line-item detail
// grid living under a collapsible "Scope Sheet" section, below the Base
// Bid / Leveled Price summary rows. DataTable's tbody is caller-authored
// JSX, so this is the client wrapper that toggles which rows render —
// the summary rows above stay server-rendered plain <tr>s, unaffected.
export function ScopeSheetRows({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr>
        <td
          colSpan={colSpan}
          onClick={() => setOpen((v) => !v)}
          className="lbl"
          style={{ cursor: "pointer", background: "var(--bg-inset)", userSelect: "none" }}
        >
          <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : undefined, transition: "transform .1s", marginRight: 6 }}>
            ▸
          </span>
          Scope Sheet
        </td>
      </tr>
      {open && children}
    </>
  );
}
