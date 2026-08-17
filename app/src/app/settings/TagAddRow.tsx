"use client";

import { useState } from "react";
import { createTag } from "./actions";

const TAG_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "location", label: "Location" },
  { value: "requirement", label: "Requirement" },
  { value: "project_type", label: "Project type" },
  { value: "contract_type", label: "Contract type" },
  { value: "special", label: "Special" },
];

// "add tag should be clean collapsed plus in darkened row at bottom of
// the table" (S-batch #54) — a table row that's just a "+" until clicked,
// then becomes the inline add form, instead of a separate boxed form.
export function TagAddRow({ colSpan, defaultType }: { colSpan: number; defaultType?: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <tr style={{ background: "var(--bg-inset)" }}>
        <td colSpan={colSpan} style={{ padding: 0 }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", padding: "9px 12px", color: "var(--text-faint)" }}
          >
            + Add tag
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: "var(--bg-inset)" }}>
      <td colSpan={colSpan} style={{ padding: "8px 12px" }}>
        <form
          action={async (fd) => {
            await createTag(fd);
            setOpen(false);
          }}
          className="flex items-center gap-2"
        >
          <input className="fld" name="name" placeholder="Tag name" required autoFocus style={{ width: 200 }} />
          <select className="fld" name="type" defaultValue={defaultType ?? "special"} style={{ width: "auto" }}>
            {TAG_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button className="btn btn--sm btn--acc" type="submit">
            Save
          </button>
          <button className="btn btn--sm btn--gh" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </form>
      </td>
    </tr>
  );
}
