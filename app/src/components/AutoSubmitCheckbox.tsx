"use client";

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
    <label className="flex items-center gap-2" style={{ fontSize: 13 }}>
      <input
        type="checkbox"
        form={form}
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      />
      {label}
    </label>
  );
}
