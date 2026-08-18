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
  setCsiDivisionName,
} from "./actions";
import { Tooltip } from "@/components/Tooltip";

export type PackageTemplateData = {
  id: string;
  name: string;
  division: string | null;
  csiCodes: string[];
};

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
export function PackageBuilder({
  packages,
  divisionOverrides,
  isAdmin,
}: {
  packages: PackageTemplateData[];
  divisionOverrides: Record<string, string>;
  isAdmin: boolean;
}) {
  const [addingNew, setAddingNew] = useState(false);

  const divisions = CSI_DIVISIONS.map((d) => ({ ...d, name: divisionOverrides[d.code] ?? d.name }));
  const divisionsWithCodes = divisions.filter((d) => CSI_CODES.some((c) => c.division === d.code));

  return (
    <div className="flex items-start gap-5">
      <div className="card" style={{ width: 380, flexShrink: 0, maxHeight: "calc(100vh - 220px)", overflowY: "auto", padding: 0 }}>
        <div className="lbl" style={{ padding: "12px 14px 8px" }}>
          CSI codes
        </div>
        {divisionsWithCodes.map((div) => {
          const codes = CSI_CODES.filter((c) => c.division === div.code);
          return (
            <details key={div.code} style={{ borderTop: "1px solid var(--border)" }}>
              <summary style={{ cursor: "pointer", padding: "8px 14px", fontSize: 12.5, fontWeight: 600, listStyle: "none" }}>
                <span className="flex items-center justify-between gap-2">
                  <span>
                    {div.code} — {div.name}
                  </span>
                  {isAdmin && <DivisionNameEditor code={div.code} name={div.name} />}
                </span>
              </summary>
              <div style={{ paddingBottom: 4 }}>
                {codes.map((c) => (
                  <CsiDragRow key={c.code} code={c.code} title={c.title} division={c.division} />
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
          {addingNew && <NewPackageCard onDone={() => setAddingNew(false)} divisions={divisions} />}
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} divisions={divisions} />
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

// Elegant drag feedback (S-notes v135a475: "make the click and drag
// elements more elegant. so i can see what i am dragging and where.") —
// the browser's default drag image is a raw screenshot of the whole row
// (code + title + arrow button), which reads as cluttered and doesn't
// match the app's own chip vocabulary. A small custom drag image styled
// like the same chip.chip--info that lands in the package card once
// dropped makes "what" unambiguous; dimming the source row + strengthening
// the drop target's highlight (below) makes "where" unambiguous too.
function CsiDragRow({ code, title, division }: { code: string; title: string; division: string }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ code }));
        e.dataTransfer.effectAllowed = "copy";
        setDragging(true);

        const ghost = document.createElement("div");
        ghost.textContent = `${code} — ${title}`;
        Object.assign(ghost.style, {
          position: "absolute",
          top: "-1000px",
          left: "-1000px",
          padding: "7px 14px",
          borderRadius: "999px",
          background: "var(--accent-fill)",
          color: "var(--accent-on)",
          font: "600 12px var(--font-display)",
          whiteSpace: "nowrap",
          boxShadow: "var(--e-2)",
        });
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 14, 14);
        requestAnimationFrame(() => document.body.removeChild(ghost));
      }}
      onDragEnd={() => setDragging(false)}
      className="flex items-center justify-between gap-2"
      style={{ padding: "6px 14px 6px 24px", fontSize: 12, cursor: "grab", opacity: dragging ? 0.35 : 1, transition: "opacity var(--dur-fast)" }}
    >
      <span>
        <span className="mono" style={{ color: "var(--text-faint)", marginRight: 8 }}>
          {code}
        </span>
        {title}
      </span>
      <button
        type="button"
        title="Add as new package"
        onClick={() => quickAddPackageFromCsi(code, title, division)}
        style={{ all: "unset", cursor: "pointer", color: "var(--accent-text)", fontWeight: 700, padding: "0 4px" }}
      >
        →
      </button>
    </div>
  );
}

function NewPackageCard({ onDone, divisions }: { onDone: () => void; divisions: Array<{ code: string; name: string }> }) {
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
        {divisions.map((d) => (
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

function PackageCard({ pkg, divisions }: { pkg: PackageTemplateData; divisions: Array<{ code: string; name: string }> }) {
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
      style={{
        outline: over ? "2px dashed var(--accent-line)" : "2px dashed transparent",
        outlineOffset: 2,
        background: over ? "var(--accent-wash)" : "var(--bg-surface-raised)",
        transition: "background var(--dur-fast), outline-color var(--dur-fast)",
      }}
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
          {divisions.map((d) => (
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
          <Tooltip key={code} label={csiTitle(code)}>
            <span className="chip chip--info">
              {code}
              <button
                type="button"
                onClick={() => removeCsiFromPackageTemplate(pkg.id, code)}
                style={{ all: "unset", cursor: "pointer", marginLeft: 4, fontWeight: 700 }}
              >
                ×
              </button>
            </span>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

// Admin-only inline rename for a CSI division's display name (#79 /
// S-notes v135a475). Lives inside a <summary>, so every handler stops
// propagation — otherwise a click meant for the input/button also toggles
// the parent <details> open/closed.
function DivisionNameEditor({ code, name }: { code: string; name: string }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        title="Rename this division (admin)"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }}
        style={{ all: "unset", cursor: "pointer", color: "var(--text-faint)", fontSize: 11, padding: "2px 4px" }}
      >
        ✎
      </button>
    );
  }

  return (
    <form
      onClick={(e) => e.stopPropagation()}
      action={async (fd) => {
        await setCsiDivisionName(code, String(fd.get("name") ?? ""));
        setEditing(false);
      }}
      className="flex items-center gap-1"
    >
      <input className="fld" name="name" defaultValue={name} autoFocus style={{ width: 160, fontSize: 12, padding: "3px 7px" }} />
      <button type="submit" className="btn btn--sm btn--gh" style={{ padding: "2px 8px", minHeight: "auto" }}>
        Save
      </button>
      <button
        type="button"
        className="btn btn--sm btn--gh"
        style={{ padding: "2px 8px", minHeight: "auto" }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditing(false);
        }}
      >
        Cancel
      </button>
    </form>
  );
}
