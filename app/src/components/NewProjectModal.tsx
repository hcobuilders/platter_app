"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createProject } from "@/app/shell-actions";

export type NewProjectTemplate = { id: string; name: string };

export function NewProjectModal({ templates = [] }: { templates?: NewProjectTemplate[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("new") === "1";
  const [mode, setMode] = useState<"manual" | "parsed">("manual");

  if (!open) return null;

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) router.push("/");
      }}
    >
      <div className="cmdk" style={{ maxWidth: 480 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 2 }}>
            New project
          </div>
        </div>
        <div style={{ padding: "10px 18px 0" }}>
          <div className="seg">
            <button type="button" aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>
              Manual
            </button>
            <button type="button" aria-pressed={false} disabled title="Coming soon" style={{ opacity: 0.45, cursor: "not-allowed" }}>
              From documents
            </button>
          </div>
        </div>
        <form action={createProject} className="flex flex-col gap-3" style={{ padding: 18 }}>
          {mode === "manual" && templates.length > 0 && (
            <div>
              <div className="lbl">Start from template (optional)</div>
              <select className="fld mt-1" name="templateId" defaultValue="">
                <option value="">— blank project —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="cf">
            <div>
              <div className="lbl">Project number</div>
              <input className="fld mt-1" name="number" required />
            </div>
            <div>
              <div className="lbl">Name</div>
              <input className="fld mt-1" name="name" required />
            </div>
          </div>
          <div>
            <div className="lbl">Address</div>
            <input className="fld mt-1" name="address" />
          </div>
          <div className="cf">
            <div>
              <div className="lbl">Owner</div>
              <input className="fld mt-1" name="owner" />
            </div>
            <div>
              <div className="lbl">Architect of record</div>
              <input className="fld mt-1" name="architectOfRecord" />
            </div>
          </div>
          <div>
            <div className="lbl">Delivery method</div>
            <input className="fld mt-1" name="deliveryMethod" placeholder="e.g. Hard bid, CM at-risk" />
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn--acc" type="submit">
              Create project
            </button>
            <button className="btn btn--gh" type="button" onClick={() => router.push("/")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
