"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseXerFile, commitScheduleActivities } from "./actions";
import type { ParsedActivity, ParsedRelationship } from "@/lib/xer";

// P6 XER import (S-batch #63) — a new two-stage pattern for this app:
// parse first (no writes), then let the owner uncheck anything before
// committing, rather than importing every row from the file blind.
// Predecessor/successor relationships (S-batch #64) ride along with
// each activity, but only ones where both ends stay selected actually
// commit — see actions.ts.
export function ScheduleImportModal({ projectNumber }: { projectNumber: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("importSchedule") === "1";
  const [candidates, setCandidates] = useState<ParsedActivity[] | null>(null);
  const [relationships, setRelationships] = useState<ParsedRelationship[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function close() {
    setCandidates(null);
    setRelationships([]);
    setSelected(new Set());
    setError(null);
    router.push(`/projects/${projectNumber}`);
  }

  async function handleFile(file: File) {
    setParsing(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const parsed = await parseXerFile(fd);
    setParsing(false);
    if (parsed.activities.length === 0) {
      setError("No TASK rows found — check this is a Primavera .xer export.");
      return;
    }
    setCandidates(parsed.activities);
    setRelationships(parsed.relationships);
    setSelected(new Set(parsed.activities.map((_, i) => i)));
  }

  async function commit() {
    if (!candidates) return;
    setCommitting(true);
    const toImport = candidates.filter((_, i) => selected.has(i));
    await commitScheduleActivities(projectNumber, toImport, relationships);
    setCommitting(false);
    close();
  }

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk" style={{ maxWidth: 640 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            Import P6 schedule (.xer)
          </div>
        </div>

        {!candidates ? (
          <div style={{ padding: 18 }}>
            <input
              className="fld"
              type="file"
              accept=".xer,text/plain"
              disabled={parsing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {parsing && (
              <p style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 8 }}>
                Parsing…
              </p>
            )}
            {error && (
              <p style={{ fontSize: 12.5, color: "var(--danger-text)", marginTop: 8 }}>
                {error}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button className="btn btn--gh" type="button" onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between" style={{ padding: "0 18px" }}>
              <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
                {selected.size} of {candidates.length} activities selected
                {relationships.length > 0 && ` · ${relationships.length} FS/SS link${relationships.length === 1 ? "" : "s"} found`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn--sm btn--gh"
                  onClick={() => setSelected(new Set(candidates.map((_, i) => i)))}
                >
                  Select all
                </button>
                <button type="button" className="btn btn--sm btn--gh" onClick={() => setSelected(new Set())}>
                  Select none
                </button>
              </div>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto", padding: "10px 18px" }}>
              {candidates.map((a, i) => (
                <label key={i} className="cclist" style={{ cursor: "pointer" }}>
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(i);
                        else next.delete(i);
                        setSelected(next);
                      }}
                    />
                    <span>
                      <span className="mono" style={{ color: "var(--text-faint)", marginRight: 8 }}>
                        {a.activityId}
                      </span>
                      {a.name}
                      {a.wbsCategory && (
                        <span style={{ color: "var(--text-faint)", marginLeft: 8 }}>({a.wbsCategory})</span>
                      )}
                    </span>
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
                    {a.startAt ? new Date(a.startAt).toLocaleDateString() : "—"}
                    {a.durationDays != null && ` · ${a.durationDays}d`}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2" style={{ padding: 18, borderTop: "1px solid var(--border-hairline)" }}>
              <button className="btn btn--acc" type="button" disabled={committing || selected.size === 0} onClick={commit}>
                {committing ? "Importing…" : `Import ${selected.size} selected`}
              </button>
              <button className="btn btn--gh" type="button" onClick={close}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
