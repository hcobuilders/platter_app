"use client";

import { useState, type CSSProperties } from "react";
import { CSI_CODES, findCsiMatches, lookupExactCsi, type CsiCode } from "@/lib/csi-codes";

export function CsiCodeInput({
  name,
  defaultValue,
  form,
  className,
  style,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  form?: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const matches: CsiCode[] = value.trim().length >= 2 ? findCsiMatches(value, 8) : [];
  const exact = lookupExactCsi(value);

  return (
    <div style={{ position: "relative" }}>
      <input
        form={form}
        name={name}
        className={className}
        style={style}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a suggestion's onMouseDown fires before the list unmounts.
          setTimeout(() => setOpen(false), 120);
        }}
      />
      {exact && !open && (
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2, whiteSpace: "nowrap" }}>{exact.title}</div>
      )}
      {open && matches.length > 0 && (
        <div className="csi-suggest">
          {matches.map((m) => (
            <div
              key={m.code}
              className="csi-suggest__row"
              onMouseDown={() => {
                setValue(m.code);
                setOpen(false);
              }}
            >
              <span className="mono">{m.code}</span>
              <span>{m.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { CSI_CODES };
