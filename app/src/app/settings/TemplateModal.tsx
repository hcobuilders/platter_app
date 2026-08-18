"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { saveProjectAsTemplate, updateProjectTemplate, removeTemplatePackage, removeTemplateBidder } from "@/app/actions";

export type TemplateBidder = { subcontractorId: string | null; name: string };
export type TemplatePackageOption = { id: string; code: string; name: string; bidders: TemplateBidder[] };
export type TemplateOption = {
  id: string;
  name: string;
  description: string | null;
  packages: TemplatePackageOption[];
};
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
      <div className="cmdk" style={{ maxWidth: editing ? 520 : 440 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            {editing ? "Edit template" : "New template from project"}
          </div>
        </div>
        {editing ? (
          <>
            <form
              action={async (fd) => {
                await updateProjectTemplate(editing.id, String(fd.get("name") ?? ""), String(fd.get("description") ?? ""));
                close();
              }}
              className="flex flex-col gap-3"
              style={{ padding: "18px 18px 0" }}
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

            <div style={{ padding: 18, marginTop: 4 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>
                Captured packages
              </div>
              {editing.packages.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 12.5 }}>No packages captured.</p>
              ) : (
                <div className="flex flex-col gap-2" style={{ maxHeight: 280, overflowY: "auto" }}>
                  {editing.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      style={{
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 8,
                        padding: "8px 10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                          <span className="mono" style={{ color: "var(--text-dim)", marginRight: 6 }}>
                            {pkg.code}
                          </span>
                          {pkg.name}
                        </div>
                        <form
                          action={async () => {
                            await removeTemplatePackage(pkg.id);
                          }}
                        >
                          <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                            Remove package
                          </button>
                        </form>
                      </div>
                      {pkg.bidders.length === 0 ? (
                        <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: 0 }}>No bidders captured.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {pkg.bidders.map((bidder, i) => (
                            <form
                              key={`${bidder.subcontractorId ?? bidder.name}-${i}`}
                              action={async () => {
                                await removeTemplateBidder(pkg.id, i);
                              }}
                            >
                              <button
                                type="submit"
                                className="chip"
                                title="Remove bidder"
                                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                              >
                                {bidder.name}
                                <span style={{ color: "var(--text-faint)" }}>×</span>
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
