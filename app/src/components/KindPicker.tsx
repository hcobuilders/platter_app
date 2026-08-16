"use client";

import { useState } from "react";

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
}: {
  name: string;
  defaultValue: string;
  form?: string;
}) {
  const [selected, setSelected] = useState(defaultValue);

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
