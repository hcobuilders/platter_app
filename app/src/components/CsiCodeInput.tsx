"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CSI_CODES, findCsiMatches, lookupExactCsi, type CsiCode } from "@/lib/csi-codes";

export function CsiCodeInput({
  name,
  defaultValue,
  form,
  className,
  style,
  placeholder,
  onCommit,
}: {
  name: string;
  defaultValue?: string;
  form?: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  /** Fired with the settled value on blur or suggestion pick — for callers
   *  driving autosave directly instead of relying on native form submission. */
  onCommit?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches: CsiCode[] = value.trim().length >= 2 ? findCsiMatches(value, 8) : [];
  const exact = lookupExactCsi(value);

  useLayoutEffect(() => {
    if (!open) return;
    function updatePos() {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 240) });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
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
          onCommit?.(value);
        }}
      />
      {exact && !open && (
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2, whiteSpace: "nowrap" }}>{exact.title}</div>
      )}
      {open &&
        matches.length > 0 &&
        pos &&
        createPortal(
          <div className="csi-suggest" style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}>
            {matches.map((m) => (
              <div
                key={m.code}
                className="csi-suggest__row"
                onMouseDown={() => {
                  setValue(m.code);
                  setOpen(false);
                  onCommit?.(m.code);
                }}
              >
                <span className="mono">{m.code}</span>
                <span>{m.title}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

export { CSI_CODES };
