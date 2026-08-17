"use client";

import { useState } from "react";
import { CSI_CODES, CSI_DIVISIONS } from "@/lib/csi-codes";
import {
  createPackageTemplate,
  updatePackageTemplateMeta,
  deletePackageTemplate,
  addCsiToPackageTemplate,
  removeCsiFromPackageTemplate,
  quickAddPackageFromCsi,
} from "./actions";

export type PackageTemplateData = {
  id: string;
  name: string;
  division: string | null;
  csiCodes: string[];
};

const DIVISIONS_WITH_CODES = CSI_DIVISIONS.filter((d) => CSI_CODES.some((c) => c.division === d.code));

function csiTitle(code: string) {
  return CSI_CODES.find((c) => c.code === code)?.title ?? code;
}

// "trades [rename to bid packages] - display with all csi codes in clean
// collapsing table on left. show pane on the right with '+' chip at top
// to add new package ... trades are dragged from the left into existing
// packages or arrow clicked adds as new package with same name and div"
// (S-batch #53). Native HTML5 drag-and-drop — no dnd library used
// elsewhere in the app, so this doesn't introduce one just for a single
// two-pane builder.
export function PackageBuilder({ packages }: { packages: PackageTemplateData[] }) {
  const [addingNew, setAddingNew] = useState(false);

  return (
    <div className="flex items-start gap-5">
      <div className="card" style={{ width: 380, flexShrink: 0, maxHeight: "calc(100vh - 220px)", overflowY: "auto", padding: 0 }}>
        <div className="lbl" style={{ padding: "12px 14px 8px" }}>
          CSI codes
        </div>
        {DIVISIONS_WITH_CODES.map((div) => {
          const codes = CSI_CODES.filter((c) => c.division === div.code);
          return (
            <details key={div.code} style={{ borderTop: "1px solid var(--border)" }}>
              <summary style={{ cursor: "pointer", padding: "8px 14px", fontSize: 12.5, fontWeight: 600, listStyle: "none" }}>
                {div.code} — {div.name}
              </summary>
              <div style={{ paddingBottom: 4 }}>
                {codes.map((c) => (
                  <div
                    key={c.code}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", JSON.stringify({ code: c.code }));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex items-center justify-between gap-2"
                    style={{ padding: "6px 14px 6px 24px", fontSize: 12, cursor: "grab" }}
                  >
                    <span>
                      <span className="mono" style={{ color: "var(--text-faint)", marginRight: 8 }}>
                        {c.code}
                      </span>
                      {c.title}
                    </span>
                    <button
                      type="button"
                      title="Add as new package"
                      onClick={() => quickAddPackageFromCsi(c.code, c.title, c.division)}
                      style={{ all: "unset", cursor: "pointer", color: "var(--accent-text)", fontWeight: 700, padding: "0 4px" }}
                    >
                      →
                    </button>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className="flex-1" style={{ minWidth: 0 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="lbl">{packages.length} bid packages</div>
          <button className="btn btn--acc btn--sm" type="button" onClick={() => setAddingNew(true)}>
            + New package
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {addingNew && <NewPackageCard onDone={() => setAddingNew(false)} />}
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
          {packages.length === 0 && !addingNew && (
            <p style={{ color: "var(--text-faint)", fontSize: 13 }}>
              No bid packages yet. Drag a CSI code in from the left, or click &ldquo;+ New package&rdquo; above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NewPackageCard({ onDone }: { onDone: () => void }) {
  return (
    <form
      className="card flex items-center gap-2"
      action={async (fd) => {
        await createPackageTemplate(String(fd.get("name") ?? ""), String(fd.get("division") ?? ""));
        onDone();
      }}
    >
      <input className="fld" name="name" placeholder="Package name" required autoFocus style={{ flex: 1 }} />
      <select className="fld" name="division" style={{ width: "auto" }} defaultValue="">
        <option value="">No division</option>
        {CSI_DIVISIONS.map((d) => (
          <option key={d.code} value={d.code}>
            {d.code} {d.name}
          </option>
        ))}
      </select>
      <button className="btn btn--acc btn--sm" type="submit">
        Save
      </button>
      <button className="btn btn--gh btn--sm" type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}

function PackageCard({ pkg }: { pkg: PackageTemplateData }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className="card"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData("text/plain");
        if (!raw) return;
        try {
          const { code } = JSON.parse(raw) as { code?: string };
          if (code) addCsiToPackageTemplate(pkg.id, code);
        } catch {
          // ignore drops that aren't our own CSI payload
        }
      }}
      style={{ outline: over ? "2px dashed var(--accent-line)" : "2px dashed transparent", outlineOffset: 2 }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <input
          className="fld"
          defaultValue={pkg.name}
          style={{ flex: 1, fontWeight: 700 }}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value && value !== pkg.name) updatePackageTemplateMeta(pkg.id, value, pkg.division ?? "");
          }}
        />
        <select
          className="fld"
          defaultValue={pkg.division ?? ""}
          style={{ width: "auto" }}
          onChange={(e) => updatePackageTemplateMeta(pkg.id, pkg.name, e.target.value)}
        >
          <option value="">No division</option>
          {CSI_DIVISIONS.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code} {d.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn--sm btn--gh"
          style={{ color: "var(--danger-text)" }}
          onClick={() => deletePackageTemplate(pkg.id)}
        >
          Delete
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {pkg.csiCodes.length === 0 && <span style={{ color: "var(--text-faint)", fontSize: 12 }}>Drag CSI codes here.</span>}
        {pkg.csiCodes.map((code) => (
          <span key={code} className="chip chip--info" title={csiTitle(code)}>
            {code}
            <button
              type="button"
              onClick={() => removeCsiFromPackageTemplate(pkg.id, code)}
              style={{ all: "unset", cursor: "pointer", marginLeft: 4, fontWeight: 700 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
