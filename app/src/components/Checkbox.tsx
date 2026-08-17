"use client";

import type { InputHTMLAttributes } from "react";

// Themed checkbox — the native <input> stays for accessibility/form
// semantics but is visually replaced by .chk__box. Per S-batch #67: raw
// unstyled checkboxes should only be a fallback, not the default.
export function Checkbox({
  label,
  className,
  ...props
}: { label?: React.ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`chk${className ? ` ${className}` : ""}`}>
      <input type="checkbox" {...props} />
      <span className="chk__box">
        <svg viewBox="0 0 16 16">
          <path d="M3.5 8.5l3 3 6-6.5" />
        </svg>
      </span>
      {label}
    </label>
  );
}
