"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const KIND_OPTIONS = [
  "inclusion",
  "exclusion",
  "alternate",
  "allowance",
  "unit_price",
  "clarification",
  "va_option",
] as const;

export const KIND_LABEL: Record<string, string> = {
  inclusion: "Inc",
  exclusion: "Exc",
  alternate: "Alt",
  allowance: "Allow",
  unit_price: "Unit $",
  clarification: "Clar",
  va_option: "VA",
};

export function KindPicker({
  name,
  defaultValue,
  form,
  compact = false,
}: {
  name: string;
  defaultValue: string;
  form?: string;
  /** Table-row use: show only the selected tag as a button that opens a
   *  dropdown of the other options, instead of the full inline pill row. */
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function updatePos() {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    function onDocClick(e: MouseEvent) {
      if (!btnRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  if (compact) {
    return (
      <div style={{ position: "relative" }}>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`kb kb--${selected}`}
          style={{ cursor: "pointer", border: "1.5px solid var(--border-strong)" }}
        >
          {KIND_LABEL[selected]} ▾
        </button>
        <input type="hidden" form={form} name={name} value={selected} />
        {open &&
          pos &&
          createPortal(
            <div className="csi-suggest" style={{ position: "fixed", top: pos.top, left: pos.left, width: "auto", padding: 6 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220 }}>
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSelected(k);
                      setOpen(false);
                    }}
                    className={`kb kb--${k}`}
                    style={{
                      cursor: "pointer",
                      border: k === selected ? "1.5px solid var(--accent-strong)" : "1.5px solid transparent",
                      opacity: k === selected ? 1 : 0.7,
                    }}
                  >
                    {KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {KIND_OPTIONS.map((k) => {
        const isOn = k === selected;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setSelected(k)}
            className={`kb kb--${k}`}
            style={{
              cursor: "pointer",
              border: isOn ? "1.5px solid var(--accent-strong)" : "1.5px solid transparent",
              opacity: isOn ? 1 : 0.45,
            }}
          >
            {KIND_LABEL[k]}
          </button>
        );
      })}
      <input type="hidden" form={form} name={name} value={selected} />
    </div>
  );
}
