"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateProjectField } from "./actions";
import type { ProjectStatus } from "@/generated/prisma/enums";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "scoping", label: "Scoping" },
  { value: "bidding", label: "Bidding" },
  { value: "leveling", label: "Leveling" },
  { value: "submitted", label: "Submitted" },
  { value: "awarded", label: "Awarded" },
  { value: "lost", label: "Lost" },
];

const IDLE_REVERT_MS = 2 * 60 * 1000;

type Values = {
  owner: string | null;
  architectOfRecord: string | null;
  deliveryMethod: string | null;
  status: ProjectStatus;
  bondPct: number | null;
  retainagePct: number | null;
  contractDays: number | null;
  squareFootage: number | null;
};

// Overview "Project" container edit toggle (S-batch #60): containers default
// read-only; Edit switches the left-column fields to click-to-edit, autosaves
// each field independently, and reverts to read-only after 2 minutes idle.
// Reload also reverts, for free — editMode is plain client state, not persisted.
export function EditableOverviewFields({ projectNumber, initial }: { projectNumber: string; initial: Values }) {
  const [editMode, setEditMode] = useState(false);
  const [values, setValues] = useState(initial);
  const [, startTransition] = useTransition();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function armIdleTimer() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setEditMode(false), IDLE_REVERT_MS);
  }

  useEffect(() => {
    if (editMode) {
      armIdleTimer();
    } else if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [editMode]);

  function commit<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    startTransition(() => {
      updateProjectField(projectNumber, field, value);
    });
    if (editMode) armIdleTimer();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="lbl">Project</div>
        <button type="button" className="btn btn--sm btn--gh" onClick={() => setEditMode((v) => !v)}>
          {editMode ? "Done" : "Edit"}
        </button>
      </div>
      <div className="cf mt-2">
        <EditableText label="Owner" value={values.owner} editMode={editMode} onCommit={(v) => commit("owner", v)} />
        <EditableText
          label="Architect of record"
          value={values.architectOfRecord}
          editMode={editMode}
          onCommit={(v) => commit("architectOfRecord", v)}
        />
        <EditableText
          label="Delivery method"
          value={values.deliveryMethod}
          editMode={editMode}
          onCommit={(v) => commit("deliveryMethod", v)}
        />
        <EditableSelect
          label="Status"
          value={values.status}
          options={STATUS_OPTIONS}
          editMode={editMode}
          onCommit={(v) => commit("status", v)}
        />
        <EditableNumber
          label="Bond %"
          value={values.bondPct}
          suffix="%"
          editMode={editMode}
          onCommit={(v) => commit("bondPct", v)}
        />
        <EditableNumber
          label="Retainage %"
          value={values.retainagePct}
          suffix="%"
          editMode={editMode}
          onCommit={(v) => commit("retainagePct", v)}
        />
        <EditableNumber
          label="Contract days"
          value={values.contractDays}
          suffix=" days"
          editMode={editMode}
          onCommit={(v) => commit("contractDays", v)}
        />
        <EditableNumber
          label="Square footage"
          value={values.squareFootage}
          suffix=" sf"
          editMode={editMode}
          onCommit={(v) => commit("squareFootage", v)}
        />
      </div>
    </div>
  );
}

function EditableText({
  label,
  value,
  editMode,
  onCommit,
}: {
  label: string;
  value: string | null;
  editMode: boolean;
  onCommit: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (!editMode) {
    return (
      <div>
        <div className="lbl">{label}</div>
        <div style={{ font: "var(--t-body)", marginTop: 4 }}>{value ?? "—"}</div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div>
        <div className="lbl">{label}</div>
        <div
          onClick={() => {
            setDraft(value ?? "");
            setEditing(true);
          }}
          style={{ font: "var(--t-body)", marginTop: 4, cursor: "text", borderBottom: "1px dashed var(--border-strong)", minHeight: 20 }}
        >
          {value ?? "—"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="lbl">{label}</div>
      <input
        className="fld"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const trimmed = draft.trim();
          if (trimmed !== (value ?? "")) onCommit(trimmed === "" ? null : trimmed);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
      />
    </div>
  );
}

function EditableNumber({
  label,
  value,
  suffix,
  editMode,
  onCommit,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  editMode: boolean;
  onCommit: (value: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value != null ? String(value) : "");

  if (!editMode) {
    return (
      <div>
        <div className="lbl">{label}</div>
        <div style={{ font: "var(--t-body)", marginTop: 4 }}>{value != null ? `${value}${suffix ?? ""}` : "—"}</div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div>
        <div className="lbl">{label}</div>
        <div
          onClick={() => {
            setDraft(value != null ? String(value) : "");
            setEditing(true);
          }}
          style={{ font: "var(--t-body)", marginTop: 4, cursor: "text", borderBottom: "1px dashed var(--border-strong)", minHeight: 20 }}
        >
          {value != null ? `${value}${suffix ?? ""}` : "—"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="lbl">{label}</div>
      <input
        className="fld"
        type="number"
        step="any"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = draft.trim() === "" ? null : Number(draft);
          if (num !== value) onCommit(Number.isNaN(num) ? null : num);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value != null ? String(value) : "");
            setEditing(false);
          }
        }}
      />
    </div>
  );
}

function EditableSelect({
  label,
  value,
  options,
  editMode,
  onCommit,
}: {
  label: string;
  value: ProjectStatus;
  options: { value: ProjectStatus; label: string }[];
  editMode: boolean;
  onCommit: (value: ProjectStatus) => void;
}) {
  const current = options.find((o) => o.value === value)?.label ?? value;

  if (!editMode) {
    return (
      <div>
        <div className="lbl">{label}</div>
        <div style={{ font: "var(--t-body)", marginTop: 4 }}>{current}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="lbl">{label}</div>
      <select
        className="fld"
        style={{ marginTop: 4 }}
        value={value}
        onChange={(e) => onCommit(e.target.value as ProjectStatus)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
