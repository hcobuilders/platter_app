"use client";

import { useRef, useState, useTransition } from "react";
import { createScopeLine, updateScopeLineField, deleteScopeLine } from "./actions";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { CsiCodeInput } from "@/components/CsiCodeInput";
import { KindPicker } from "@/components/KindPicker";
import { Checkbox } from "@/components/Checkbox";
import { RowMenu } from "@/components/RowMenu";

type Line = {
  id: string;
  seq: number;
  csiCode: string | null;
  description: string;
  unit: string | null;
  qty: number | null;
  kind: string;
  isRequired: boolean;
  submittalRequired: boolean;
  longLeadWeeks: number | null;
};

function toNum(s: string): number | null {
  const t = s.trim();
  return t === "" ? null : Number(t);
}
function toInt(s: string): number | null {
  const t = s.trim();
  return t === "" ? null : parseInt(t, 10);
}

const WORKSHEET_COLUMNS: DataTableColumn[] = [
  { id: "seq", label: "#", width: 44, minWidth: 36 },
  { id: "csi", label: "CSI", width: 110 },
  { id: "description", label: "Description", width: 260 },
  { id: "unit", label: "Unit", width: 80 },
  { id: "qty", label: "Qty", width: 90, align: "right" },
  { id: "kind", label: "Kind", width: 110 },
  { id: "required", label: "Required", width: 90, align: "center" },
  { id: "submittal", label: "Submittal", width: 90, align: "center" },
  { id: "longlead", label: "Long lead (wks)", width: 120, align: "right" },
  { id: "actions", label: "", width: 44, minWidth: 44, resizable: false, icon: true },
];

// Autosave, no per-row Save/Delete — per S-batch #68 ("remove save delete.
// show save state for the whole table under the container on the right").
// Each field commits directly via a server action call on blur/change
// (useTransition, not a native form submit), so one shared pending flag
// covers the whole table regardless of which row/field last changed.
export function ScopeWorksheetTable({
  projectNumber,
  packageId,
  lines,
}: {
  projectNumber: string;
  packageId: string;
  lines: Line[];
}) {
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit<K extends keyof Line>(id: string, field: K extends "id" | "seq" ? never : K, value: Line[K]) {
    startTransition(async () => {
      await updateScopeLineField(projectNumber, id, field as never, value as never);
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 1400);
    });
  }

  const addFormId = "add-scope-line-form";

  return (
    <div>
      <DataTable
        id="scope-tbl"
        columns={WORKSHEET_COLUMNS}
        footer={
          <tr>
            <td className="mono" style={{ color: "var(--text-faint)" }}>
              +
            </td>
            <td>
              <CsiCodeInput form={addFormId} className="tfld mono" name="csiCode" />
            </td>
            <td>
              <input form={addFormId} className="tfld" name="description" placeholder="Description" required />
            </td>
            <td>
              <input form={addFormId} className="tfld" name="unit" placeholder="Unit" />
            </td>
            <td className="n">
              <input form={addFormId} className="tfld n" name="qty" type="number" step="any" />
            </td>
            <td>
              <KindPicker form={addFormId} name="kind" defaultValue="inclusion" compact />
            </td>
            <td className="ctr">
              <Checkbox form={addFormId} name="isRequired" defaultChecked aria-label="Required" />
            </td>
            <td className="ctr">
              <Checkbox form={addFormId} name="submittalRequired" aria-label="Submittal required" />
            </td>
            <td className="n">
              <input form={addFormId} className="tfld n" name="longLeadWeeks" type="number" style={{ width: 60 }} />
            </td>
            <td>
              <button form={addFormId} className="btn btn--sm btn--acc" type="submit">
                + Add line
              </button>
            </td>
          </tr>
        }
      >
        {lines.map((line) => (
          <ScopeRow key={line.id} projectNumber={projectNumber} line={line} onCommit={commit} />
        ))}
      </DataTable>
      <div style={{ textAlign: "right", fontSize: 11.5, color: "var(--text-faint)", marginTop: 6, minHeight: 16 }}>
        {isPending ? "Saving…" : justSaved ? "✓ Saved" : ""}
      </div>
      <form id={addFormId} action={(fd) => createScopeLine(projectNumber, packageId, fd)} style={{ display: "none" }} />
    </div>
  );
}

function ScopeRow({
  projectNumber: _projectNumber,
  line,
  onCommit,
}: {
  projectNumber: string;
  line: Line;
  onCommit: <K extends keyof Line>(id: string, field: K extends "id" | "seq" ? never : K, value: Line[K]) => void;
}) {
  const [description, setDescription] = useState(line.description);
  const [unit, setUnit] = useState(line.unit ?? "");
  const [qty, setQty] = useState(line.qty?.toString() ?? "");
  const [longLead, setLongLead] = useState(line.longLeadWeeks?.toString() ?? "");
  const saved = useRef({ description: line.description, unit: line.unit ?? "", qty: line.qty?.toString() ?? "", longLead: line.longLeadWeeks?.toString() ?? "" });

  return (
    <tr>
      <td className="mono">{line.seq}</td>
      <td>
        <CsiCodeInput
          className="tfld mono"
          name="csiCode"
          defaultValue={line.csiCode ?? ""}
          onCommit={(v) => onCommit(line.id, "csiCode", v || null)}
        />
      </td>
      <td className="wrap">
        <input
          className="tfld"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== saved.current.description) {
              saved.current.description = description;
              onCommit(line.id, "description", description);
            }
          }}
        />
      </td>
      <td>
        <input
          className="tfld"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          onBlur={() => {
            if (unit !== saved.current.unit) {
              saved.current.unit = unit;
              onCommit(line.id, "unit", unit || null);
            }
          }}
        />
      </td>
      <td className="n">
        <input
          className="tfld n"
          type="number"
          step="any"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={() => {
            if (qty !== saved.current.qty) {
              saved.current.qty = qty;
              onCommit(line.id, "qty", toNum(qty));
            }
          }}
        />
      </td>
      <td>
        <KindPicker name="kind" defaultValue={line.kind} compact onCommit={(v) => onCommit(line.id, "kind", v)} />
      </td>
      <td className="ctr">
        <Checkbox
          defaultChecked={line.isRequired}
          aria-label="Required"
          onChange={(e) => onCommit(line.id, "isRequired", e.currentTarget.checked)}
        />
      </td>
      <td className="ctr">
        <Checkbox
          defaultChecked={line.submittalRequired}
          aria-label="Submittal required"
          onChange={(e) => onCommit(line.id, "submittalRequired", e.currentTarget.checked)}
        />
      </td>
      <td className="n">
        <input
          className="tfld n"
          type="number"
          value={longLead}
          onChange={(e) => setLongLead(e.target.value)}
          onBlur={() => {
            if (longLead !== saved.current.longLead) {
              saved.current.longLead = longLead;
              onCommit(line.id, "longLeadWeeks", toInt(longLead));
            }
          }}
        />
      </td>
      <td className="icon">
        <RowMenu>
          {(close) => (
            <button
              type="button"
              style={{ color: "var(--danger-text)" }}
              onClick={() => {
                if (!confirm(`Delete "${line.description}"?`)) return;
                deleteScopeLine(_projectNumber, line.id);
                close();
              }}
            >
              Delete
            </button>
          )}
        </RowMenu>
      </td>
    </tr>
  );
}
