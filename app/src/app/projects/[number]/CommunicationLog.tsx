"use client";

import { useState, useTransition } from "react";
import { logCommunication, removeCommunication } from "./actions";

export type CommunicationKind = "call" | "email" | "site_visit" | "note";

export type CommunicationEntry = {
  id: string;
  kind: string;
  body: string;
  author: string;
  at: Date;
  subcontractorName: string | null;
};

export type SubOption = { id: string; name: string };

const KIND_META: Record<CommunicationKind, string> = {
  call: "Call",
  email: "Email",
  site_visit: "Site visit",
  note: "Note",
};
const KIND_ORDER: CommunicationKind[] = ["call", "email", "site_visit", "note"];

// "Log communication" quick action (S-notes v135a475), matching the
// wireframe's inline card (batch-3, 3.2) — stays inline on Overview rather
// than a modal, same "don't leave the page" reasoning as Hot items.
export function CommunicationLog({
  projectNumber,
  initial,
  subs,
}: {
  projectNumber: string;
  initial: CommunicationEntry[];
  subs: SubOption[];
}) {
  const [items, setItems] = useState(initial);
  const [logging, setLogging] = useState(false);
  const [, startTransition] = useTransition();

  function handleLog(kind: CommunicationKind, body: string, subcontractorId: string) {
    setLogging(false);
    startTransition(() => logCommunication(projectNumber, kind, body, subcontractorId));
    const subName = subs.find((s) => s.id === subcontractorId)?.name ?? null;
    setItems((prev) => [
      { id: `pending-${Date.now()}`, kind, body, author: "You", at: new Date(), subcontractorName: subName },
      ...prev,
    ]);
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(() => removeCommunication(projectNumber, id));
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div className="lbl" style={{ margin: 0 }}>
          Communications
        </div>
        {!logging && (
          <button type="button" className="btn btn--sm btn--gh" onClick={() => setLogging(true)}>
            + Log communication
          </button>
        )}
      </div>

      {logging && (
        <div className="mt-2 mb-3">
          <CommunicationEditor subs={subs} onSave={handleLog} onDiscard={() => setLogging(false)} />
        </div>
      )}

      {items.length === 0 && !logging && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None logged yet.</p>}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="rule">
            <span
              className="chip"
              style={{ marginTop: 1, flexShrink: 0 }}
            >
              {KIND_META[(item.kind as CommunicationKind) in KIND_META ? (item.kind as CommunicationKind) : "note"]}
            </span>
            <div className="rtxt">
              {item.body}
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                {item.author}
                {item.subcontractorName && ` · ${item.subcontractorName}`} · {item.at.toLocaleDateString()}
              </div>
            </div>
            <button
              type="button"
              className="btn btn--sm btn--gh"
              onClick={() => handleRemove(item.id)}
              style={{ color: "var(--danger-text)" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunicationEditor({
  subs,
  onSave,
  onDiscard,
}: {
  subs: SubOption[];
  onSave: (kind: CommunicationKind, body: string, subcontractorId: string) => void;
  onDiscard: () => void;
}) {
  const [kind, setKind] = useState<CommunicationKind>("call");
  const [body, setBody] = useState("");
  const [subcontractorId, setSubcontractorId] = useState("");

  return (
    <div className="flex flex-col gap-2" style={{ padding: "10px 12px", background: "var(--bg-inset)", borderRadius: "var(--r-sm)" }}>
      <div className="flex items-center gap-2 flex-wrap">
        {KIND_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`chip${kind === k ? " chip--acc" : ""}`}
            style={{ cursor: "pointer", border: "1px solid var(--border-strong)" }}
          >
            {KIND_META[k]}
          </button>
        ))}
        {subs.length > 0 && (
          <select className="fld" value={subcontractorId} onChange={(e) => setSubcontractorId(e.target.value)} style={{ width: "auto", marginLeft: "auto" }}>
            <option value="">No specific sub</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <textarea
        className="fld"
        autoFocus
        rows={2}
        placeholder="Called Gulf Steel re: 5A pricing timeline…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ resize: "vertical" }}
      />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn--sm btn--gh" onClick={onDiscard}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--sm btn--acc"
          disabled={!body.trim()}
          onClick={() => onSave(kind, body.trim(), subcontractorId)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
