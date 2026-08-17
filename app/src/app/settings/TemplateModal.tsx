"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { saveProjectAsTemplate, updateProjectTemplate } from "@/app/actions";

export type TemplateOption = { id: string; name: string; description: string | null };
export type ProjectOption = { number: string; name: string };

// "New items are added automatically via drag and drop or plus icon at
// top" (S-batch #55) — the "+" path: pick a project to snapshot, right
// from Settings instead of needing the dashboard card kebab. Drag-and-drop
// creation is deferred — there's no obvious drop target/source across
// pages for a snapshot action like this one.
export function TemplateModal({ templates, projects }: { templates: TemplateOption[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const param = searchParams.get("template");
  if (!param) return null;

  const editing = param !== "new" ? templates.find((t) => t.id === param) : undefined;
  if (param !== "new" && !editing) return null;

  function close() {
    router.push("?view=templates");
  }

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk" style={{ maxWidth: 440 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            {editing ? "Edit template" : "New template from project"}
          </div>
        </div>
        {editing ? (
          <form
            action={async (fd) => {
              await updateProjectTemplate(editing.id, String(fd.get("name") ?? ""), String(fd.get("description") ?? ""));
              close();
            }}
            className="flex flex-col gap-3"
            style={{ padding: 18 }}
          >
            <input className="fld" name="name" placeholder="Template name" defaultValue={editing.name} required autoFocus />
            <textarea className="fld" name="description" placeholder="Description (optional)" defaultValue={editing.description ?? ""} rows={3} />
            <div className="flex gap-2 mt-2">
              <button className="btn btn--acc" type="submit">
                Save changes
              </button>
              <button className="btn btn--gh" type="button" onClick={close}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form
            action={async (fd) => {
              const projectNumber = String(fd.get("projectNumber") ?? "");
              if (!projectNumber) return;
              await saveProjectAsTemplate(projectNumber, String(fd.get("name") ?? ""), String(fd.get("description") ?? ""));
              close();
            }}
            className="flex flex-col gap-3"
            style={{ padding: 18 }}
          >
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Source project
              </div>
              <select className="fld" name="projectNumber" required defaultValue="" autoFocus>
                <option value="" disabled>
                  — select a project —
                </option>
                {projects.map((p) => (
                  <option key={p.number} value={p.number}>
                    {p.name} ({p.number})
                  </option>
                ))}
              </select>
            </div>
            <input className="fld" name="name" placeholder="Template name (optional)" />
            <textarea className="fld" name="description" placeholder="Description (optional)" rows={3} />
            <p style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
              Captures bid packages + bidder lists only — no cost data, project info, or scope line items.
            </p>
            <div className="flex gap-2 mt-2">
              <button className="btn btn--acc" type="submit">
                Save template
              </button>
              <button className="btn btn--gh" type="button" onClick={close}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
