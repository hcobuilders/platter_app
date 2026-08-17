"use client";

import { useEffect, useState, useTransition } from "react";
import { addHotItem, updateHotItem, removeHotItem, markItemsSeen } from "./actions";
import { NewBadge } from "@/components/NewBadge";
import type { ProjectNoteState } from "@/generated/prisma/enums";

const STATE_META: Record<ProjectNoteState, { label: string; color: string }> = {
  neutral: { label: "Neutral", color: "var(--text-faint)" },
  risk: { label: "Risk", color: "var(--danger-fill)" },
  resolved: { label: "Resolved", color: "var(--success-fill)" },
};
const STATE_ORDER: ProjectNoteState[] = ["neutral", "risk", "resolved"];

export type HotItem = {
  id: string;
  body: string;
  author: string;
  state: ProjectNoteState;
  associatedAt: Date | null;
  createdAt: Date;
  isNew?: boolean;
};

function ColorPick({ value, onChange }: { value: ProjectNoteState; onChange: (v: ProjectNoteState) => void }) {
  return (
    <div className="flex items-center gap-2">
      {STATE_ORDER.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          title={STATE_META[s].label}
          aria-pressed={value === s}
          style={{
            all: "unset",
            cursor: "pointer",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: STATE_META[s].color,
            border: value === s ? "2px solid var(--text)" : "2px solid transparent",
            boxShadow: value === s ? "none" : "0 0 0 1px var(--border-strong)",
          }}
        />
      ))}
    </div>
  );
}

// Hot items live inline in the Overview container now (S-batch #65) instead
// of a separate card: click an existing item to edit it in place, or the
// "+" below the last item to add one, each with a 3-way red/green/neutral
// color pick and explicit save/discard rather than a form-submit.
export function HotItemsList({ projectNumber, initial }: { projectNumber: string; initial: HotItem[] }) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();
  const [unseenIdsAtMount] = useState(() => initial.filter((it) => it.isNew).map((it) => it.id));

  // Marks this view's "new" items seen so the glyph won't show again for
  // this user — but only after they've actually rendered once (this effect,
  // not the initial server-computed isNew), so it doesn't clear itself.
  useEffect(() => {
    if (unseenIdsAtMount.length === 0) return;
    startTransition(() => {
      markItemsSeen("hot_item", unseenIdsAtMount);
    });
  }, [unseenIdsAtMount]);

  function handleSaveEdit(id: string, body: string, state: ProjectNoteState) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, body, state } : it)));
    setEditingId(null);
    startTransition(() => updateHotItem(projectNumber, id, body, state));
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setEditingId(null);
    startTransition(() => removeHotItem(projectNumber, id));
  }

  function handleAdd(body: string, associatedAt: string, state: ProjectNoteState) {
    setAdding(false);
    startTransition(() => addHotItem(projectNumber, body, associatedAt, state));
    // Optimistic placeholder until revalidation brings the real row (with id/author) in.
    setItems((prev) => [
      ...prev,
      { id: `pending-${Date.now()}`, body, author: "You", state, associatedAt: associatedAt ? new Date(associatedAt) : null, createdAt: new Date() },
    ]);
  }

  return (
    <div>
      <div className="lbl" style={{ marginBottom: 8 }}>
        Hot items
      </div>
      {items.length === 0 && !adding && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None yet — add one below.</p>}
      <div className="flex flex-col gap-2">
        {items.map((item) =>
          editingId === item.id ? (
            <HotItemEditor
              key={item.id}
              initialBody={item.body}
              initialState={item.state}
              onSave={(body, state) => handleSaveEdit(item.id, body, state)}
              onDiscard={() => setEditingId(null)}
              onRemove={() => handleRemove(item.id)}
            />
          ) : (
            <div
              key={item.id}
              onClick={() => setEditingId(item.id)}
              className="rule"
              style={{ cursor: "pointer" }}
            >
              <span className="dot" style={{ background: STATE_META[item.state].color, marginTop: 6 }} />
              <div className="rtxt">
                <span className="flex items-center gap-2">
                  {item.isNew && <NewBadge />}
                  {item.body}
                </span>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                  Added by {item.author}
                  {item.associatedAt && ` · re: ${item.associatedAt.toLocaleDateString()}`} · {item.createdAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {adding ? (
        <div className="mt-2">
          <HotItemEditor
            initialBody=""
            initialState="neutral"
            onSave={(body, state, associatedAt) => handleAdd(body, associatedAt ?? "", state)}
            onDiscard={() => setAdding(false)}
            showDate
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn btn--sm btn--gh"
          style={{ marginTop: 10, width: 28, height: 28, padding: 0, borderRadius: "50%" }}
          title="Add hot item"
          aria-label="Add hot item"
        >
          +
        </button>
      )}
    </div>
  );
}

function HotItemEditor({
  initialBody,
  initialState,
  showDate,
  onSave,
  onDiscard,
  onRemove,
}: {
  initialBody: string;
  initialState: ProjectNoteState;
  showDate?: boolean;
  onSave: (body: string, state: ProjectNoteState, associatedAt?: string) => void;
  onDiscard: () => void;
  onRemove?: () => void;
}) {
  const [body, setBody] = useState(initialBody);
  const [state, setState] = useState<ProjectNoteState>(initialState);
  const [associatedAt, setAssociatedAt] = useState("");

  return (
    <div className="flex flex-col gap-2" style={{ padding: "10px 12px", background: "var(--bg-inset)", borderRadius: "var(--r-sm)" }} onClick={(e) => e.stopPropagation()}>
      <textarea
        className="fld"
        autoFocus
        rows={2}
        placeholder="What's important here?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ resize: "vertical" }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ColorPick value={state} onChange={setState} />
          {showDate && (
            <input className="fld" type="date" title="Associated date (optional)" value={associatedAt} onChange={(e) => setAssociatedAt(e.target.value)} style={{ width: "auto" }} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRemove && (
            <button type="button" className="btn btn--sm btn--gh" onClick={onRemove} style={{ color: "var(--danger-text)" }}>
              Remove
            </button>
          )}
          <button type="button" className="btn btn--sm btn--gh" onClick={onDiscard}>
            Discard
          </button>
          <button
            type="button"
            className="btn btn--sm btn--acc"
            disabled={!body.trim()}
            onClick={() => onSave(body.trim(), state, associatedAt)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
