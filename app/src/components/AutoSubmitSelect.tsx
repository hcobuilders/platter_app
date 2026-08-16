"use client";

import { useRef } from "react";
import { pushUndo } from "@/lib/undoStack";

export function AutoSubmitSelect({
  name,
  defaultValue,
  form,
  className,
  options,
}: {
  name: string;
  defaultValue?: string;
  form?: string;
  className?: string;
  options: Array<{ value: string; label: string }>;
}) {
  const savedValueRef = useRef(defaultValue ?? "");

  return (
    <select
      form={form}
      name={name}
      className={className}
      defaultValue={defaultValue ?? ""}
      onChange={(e) => {
        if (e.currentTarget.value !== savedValueRef.current) {
          if (form) pushUndo({ formId: form, fieldName: name, prevValue: savedValueRef.current });
          savedValueRef.current = e.currentTarget.value;
          e.currentTarget.form?.requestSubmit();
        }
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
