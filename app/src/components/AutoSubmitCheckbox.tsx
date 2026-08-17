"use client";

import { Checkbox } from "@/components/Checkbox";

export function AutoSubmitCheckbox({
  name,
  defaultChecked,
  form,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  form?: string;
  label: string;
}) {
  return (
    <Checkbox
      form={form}
      name={name}
      defaultChecked={defaultChecked}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      label={label}
    />
  );
}
