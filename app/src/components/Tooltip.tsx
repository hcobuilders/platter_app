"use client";

import { useState, type ReactNode } from "react";

// On-brand hover tooltip, replacing the browser's native `title` attribute
// wherever a hover-for-context affordance matters enough to look designed
// (S-notes v135a475: "stylize the on hover element to make it match the
// app and be more stand out so its like a tooltip"). Native `title` still
// works fine for throwaway hints; this is for the ones worth polishing.
export function Tooltip({ label, children, side = "top" }: { label: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="tt"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && <span className={`tt__bubble tt__bubble--${side}`}>{label}</span>}
    </span>
  );
}
