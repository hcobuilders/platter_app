"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateProjectStatusFromCard } from "@/app/actions";
import type { ProjectStatus } from "@/generated/prisma/enums";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scoping: "Scoping",
  bidding: "Bidding",
  leveling: "Leveling",
  submitted: "Submitted",
  awarded: "Awarded",
  lost: "Lost",
};
const STATUS_CLASS: Record<string, string> = {
  draft: "st--draft",
  scoping: "st--draft",
  bidding: "st--bid",
  leveling: "st--bid",
  submitted: "st--bid",
  awarded: "st--won",
  lost: "st--lost",
};
const STATUS_ORDER: ProjectStatus[] = ["draft", "scoping", "bidding", "leveling", "submitted", "awarded", "lost"];

// Click-to-change status pill on dashboard project cards (S-batch #71):
// "remember how i should be able to click the pill to modify the project
// status." Optimistic locally, persisted via a server action.
export function StatusPill({ projectNumber, status }: { projectNumber: string; status: ProjectStatus }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(status);
  const [, startTransition] = useTransition();
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={`st ${STATUS_CLASS[current] ?? ""}`}
        style={{
          // Was `all: "unset"` — resets EVERY property including `color`,
          // which silently wins over the .st--draft/--won/--lost class's
          // own `color` (inline style beats external-stylesheet
          // specificity regardless of the selector). The dot (`<i>`,
          // `background:currentColor`) inherits that color, so it rendered
          // plain black instead of the status color (S-notes v135a475:
          // "the tag colors in the dashboard page stopped working... just
          // shows a black circle"). Reset only the structural button
          // chrome instead, leaving `color` to the class.
          border: "none",
          background: "none",
          padding: 0,
          margin: 0,
          textAlign: "left",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          font: "inherit",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <i />
        {STATUS_LABEL[current] ?? current}
      </button>
      {open && (
        <div className="pop" style={{ top: "calc(100% + 4px)", left: 0, minWidth: 150 }}>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrent(s);
                setOpen(false);
                startTransition(() => {
                  updateProjectStatusFromCard(projectNumber, s);
                });
              }}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
