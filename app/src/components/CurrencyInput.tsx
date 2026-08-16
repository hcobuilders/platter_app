"use client";

import { useRef, useState } from "react";
import { pushUndo } from "@/lib/undoStack";

const displayFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toDisplay(raw: string): string {
  const n = Number(raw);
  if (raw === "" || Number.isNaN(n)) return "";
  return displayFormatter.format(n);
}

export function CurrencyInput({
  name,
  defaultValue,
  form,
  className,
  placeholder,
  style,
  autoSubmit = false,
}: {
  name: string;
  defaultValue?: number | string;
  form?: string;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  /** Submit the associated form on blur, only if the value actually changed. */
  autoSubmit?: boolean;
}) {
  const initialRaw = defaultValue === undefined || defaultValue === "" ? "" : String(defaultValue);
  const [raw, setRaw] = useState(initialRaw);
  const [editing, setEditing] = useState(false);
  const savedValueRef = useRef(initialRaw);

  return (
    <>
      {/* Visible field is display/edit-only — never submitted directly, since
          its shown value is a formatted "$1,234.00" string that Number()
          can't parse. The hidden input below carries the actual raw value. */}
      <input
        form={form}
        className={className}
        style={style}
        placeholder={placeholder}
        inputMode="decimal"
        value={editing ? raw : toDisplay(raw) || ""}
        onFocus={() => setEditing(true)}
        onBlur={(e) => {
          setEditing(false);
          if (autoSubmit && raw !== savedValueRef.current) {
            if (form) pushUndo({ formId: form, fieldName: name, prevValue: savedValueRef.current });
            savedValueRef.current = raw;
            e.currentTarget.form?.requestSubmit();
          }
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.-]/g, "");
          setRaw(v);
        }}
      />
      <input type="hidden" form={form} name={name} value={raw} />
    </>
  );
}
