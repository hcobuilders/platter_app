"use client";

import { useRef } from "react";
import { pushUndo } from "@/lib/undoStack";

export function AutoSubmitField({
  name,
  defaultValue,
  form,
  className,
  placeholder,
  style,
}: {
  name: string;
  defaultValue?: string;
  form?: string;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const savedValueRef = useRef(defaultValue ?? "");

  return (
    <input
      form={form}
      name={name}
      className={className}
      style={style}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onBlur={(e) => {
        if (e.currentTarget.value !== savedValueRef.current) {
          if (form) pushUndo({ formId: form, fieldName: name, prevValue: savedValueRef.current });
          savedValueRef.current = e.currentTarget.value;
          e.currentTarget.form?.requestSubmit();
        }
      }}
    />
  );
}
