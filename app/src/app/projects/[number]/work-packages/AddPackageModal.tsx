"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createBidPackage } from "./actions";

export type PackageTemplateOption = { id: string; name: string; division: string | null; csiCodes: string[] };

// GH #73 — the manual add-package flow that #53's template builder
// needed to actually close the loop: pick a PackageTemplate here and its
// csiCodes come along for free.
export function AddPackageModal({ projectNumber, templates }: { projectNumber: string; templates: PackageTemplateOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("newPackage") === "1";
  if (!open) return null;

  function close() {
    router.push(`/projects/${projectNumber}/work-packages`);
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
            New bid package
          </div>
        </div>
        <form
          action={async (fd) => {
            await createBidPackage(projectNumber, fd);
            close();
          }}
          className="flex flex-col gap-3"
          style={{ padding: 18 }}
        >
          <div className="flex gap-2">
            <input className="fld" name="code" placeholder="Code (e.g. 8A)" required autoFocus style={{ width: 120 }} />
            <input className="fld" name="name" placeholder="Package name" required style={{ flex: 1 }} />
          </div>
          {templates.length > 0 && (
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Start from a template (optional)
              </div>
              <select className="fld" name="templateId" defaultValue="">
                <option value="">No template — blank package</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.csiCodes.length} CSI code{t.csiCodes.length === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
                Pulls in the template&apos;s CSI codes automatically — set up templates in Settings &gt; Bid Packages.
              </p>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button className="btn btn--acc" type="submit">
              Create package
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
