"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createFlag, updateFlag } from "./actions";

export type FlagOption = {
  id: string;
  label: string;
  type: string;
  description: string | null;
  color: string | null;
  glyph: string | null;
};

const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default (by type)" },
  { value: "dgr", label: "Danger" },
  { value: "info", label: "Info" },
  { value: "risk", label: "Risk (outline)" },
  { value: "ok", label: "Success" },
  { value: "acc", label: "Accent" },
];

// "new flag as window ... allow edit of existing there is no edit only
// delete" (S-batch #52) — one query-param-driven modal handles both create
// (?flag=new) and edit (?flag=<id>), matching the app's existing modal
// convention (NewProjectModal, AddBiddersModal).
export function FlagModal({ flags }: { flags: FlagOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flagParam = searchParams.get("flag");
  if (!flagParam) return null;

  const editing = flagParam !== "new" ? flags.find((f) => f.id === flagParam) : undefined;
  if (flagParam !== "new" && !editing) return null;

  function close() {
    router.push("?view=flags");
  }

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk" style={{ maxWidth: 420 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            {editing ? "Edit flag" : "New flag"}
          </div>
        </div>
        <form
          action={async (fd) => {
            if (editing) await updateFlag(editing.id, fd);
            else await createFlag(fd);
            close();
          }}
          className="flex flex-col gap-3"
          style={{ padding: 18 }}
        >
          <input className="fld" name="label" placeholder="Label" defaultValue={editing?.label} required autoFocus />
          <select className="fld" name="type" defaultValue={editing?.type ?? "requirement"}>
            <option value="requirement">Requirement</option>
            <option value="informational">Informational</option>
            <option value="risk">Risk</option>
          </select>
          <input className="fld" name="description" placeholder="Description (optional)" defaultValue={editing?.description ?? ""} />
          <div className="cf">
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Glyph (optional)
              </div>
              <input className="fld" name="glyph" placeholder="e.g. ⚠" maxLength={2} defaultValue={editing?.glyph ?? ""} />
            </div>
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Color
              </div>
              <select className="fld" name="color" defaultValue={editing?.color ?? ""}>
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn--acc" type="submit">
              {editing ? "Save changes" : "Save flag"}
            </button>
            <button className="btn btn--gh" type="button" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
