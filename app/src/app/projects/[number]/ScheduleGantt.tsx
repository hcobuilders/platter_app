"use client";

import { useState } from "react";
import {
  removeScheduleActivity,
  toggleScheduleActivityPin,
  addScheduleRelationship,
  removeScheduleRelationship,
  setScheduleRowHeight,
} from "./actions";
import type { ScheduleRelType } from "@/generated/prisma/enums";

type RelLink = { id: string; type: ScheduleRelType; activity: { id: string; name: string } };

export type ScheduleActivityData = {
  id: string;
  activityId: string;
  name: string;
  wbsCategory: string | null;
  startAt: Date | null;
  finishAt: Date | null;
  durationDays: number | null;
  pinned: boolean;
  predecessorLinks: RelLink[];
  successorLinks: RelLink[];
};

type Row = { kind: "header"; label: string } | { kind: "activity"; data: ScheduleActivityData };

const COLLAPSE_LIMIT = 10;

// Pinned activities always sit in their own group above every WBS group,
// regardless of the collapse limit — that's the whole point of pinning
// (S-batch #64). Remaining rows group by wbsCategory, alphabetically,
// with ungrouped activities last.
function buildRows(activities: ScheduleActivityData[], expanded: boolean): { rows: Row[]; hiddenCount: number } {
  const pinned = activities.filter((a) => a.pinned);
  const unpinned = activities.filter((a) => !a.pinned);

  const groups = new Map<string, ScheduleActivityData[]>();
  for (const a of unpinned) {
    const key = a.wbsCategory ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });

  const rows: Row[] = [];
  if (pinned.length > 0) {
    rows.push({ kind: "header", label: "Pinned" });
    for (const a of pinned) rows.push({ kind: "activity", data: a });
  }
  for (const key of sortedKeys) {
    rows.push({ kind: "header", label: key || "Ungrouped" });
    for (const a of groups.get(key)!) rows.push({ kind: "activity", data: a });
  }

  if (expanded) return { rows, hiddenCount: 0 };

  const limited: Row[] = [];
  let activityCount = 0;
  for (const row of rows) {
    if (row.kind === "activity") {
      if (activityCount >= COLLAPSE_LIMIT) continue;
      activityCount++;
    }
    limited.push(row);
  }
  while (limited.length > 0 && limited[limited.length - 1].kind === "header") limited.pop();

  const totalActivities = pinned.length + unpinned.length;
  return { rows: limited, hiddenCount: totalActivities - activityCount };
}

// "collapse this container to be no more than 10 rows unless the user
// clicks expand" (S-batch #63). Same left-pane-table / right-pane-chart
// language as GanttTimeline (#62), but every row here is a real
// start→finish span from the imported P6 file rather than a milestone.
export function ScheduleGantt({
  projectNumber,
  activities,
  rowHeight,
}: {
  projectNumber: string;
  activities: ScheduleActivityData[];
  rowHeight: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuFor, setMenuFor] = useState<{ id: string; x: number; y: number } | null>(null);

  const rowHControl = (
    <div className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--text-faint)" }}>
      Row height
      <button
        type="button"
        className="btn btn--sm btn--gh"
        style={{ padding: "2px 8px", minHeight: "auto" }}
        onClick={() => setScheduleRowHeight(projectNumber, rowHeight - 4)}
      >
        −
      </button>
      <span className="mono">{rowHeight}</span>
      <button
        type="button"
        className="btn btn--sm btn--gh"
        style={{ padding: "2px 8px", minHeight: "auto" }}
        onClick={() => setScheduleRowHeight(projectNumber, rowHeight + 4)}
      >
        +
      </button>
    </div>
  );

  if (activities.length === 0) {
    return (
      <div>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No schedule imported yet.</p>
      </div>
    );
  }

  const { rows, hiddenCount } = buildRows(activities, expanded);

  const anchorTimes = activities.flatMap((a) =>
    [a.startAt?.getTime(), a.finishAt?.getTime()].filter((t): t is number => t != null)
  );
  // No Date.now() fallback here — a client component render must stay
  // pure, and a fixed zero-width range with the chart pane simply
  // rendering no bars is a fine fallback when nothing has real dates.
  const min = anchorTimes.length ? Math.min(...anchorTimes) : 0;
  const max = anchorTimes.length ? Math.max(...anchorTimes) : 86400000;
  const span = Math.max(max - min, 86400000);
  const pad = span * 0.04;
  const rangeMin = min - pad;
  const rangeSpan = span + pad * 2;
  const rowH = rowHeight;
  const headerRowH = 24;

  const menuActivity = menuFor ? activities.find((a) => a.id === menuFor.id) : null;
  const otherActivities = menuActivity ? activities.filter((a) => a.id !== menuActivity.id) : [];

  return (
    <div>
      <div className="flex justify-end" style={{ marginBottom: 8 }}>
        {rowHControl}
      </div>
      <div className="flex" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid var(--border)" }}>
          <div
            className="lbl flex items-center"
            style={{ height: 28, padding: "0 10px", background: "var(--bg-inset)", borderBottom: "1px solid var(--border)" }}
          >
            <span style={{ width: 20, flexShrink: 0 }} />
            <span style={{ width: 150, flexShrink: 0 }}>Activity</span>
            <span style={{ whiteSpace: "nowrap" }}>Duration</span>
          </div>
          {rows.map((row, i) =>
            row.kind === "header" ? (
              <div
                key={`h-${i}`}
                className="lbl"
                style={{
                  height: headerRowH,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 10px",
                  background: "var(--bg-inset)",
                  color: "var(--text-dim)",
                }}
              >
                {row.label}
              </div>
            ) : (
              <div
                key={row.data.id}
                className="flex items-center"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuFor({ id: row.data.id, x: e.clientX, y: e.clientY });
                }}
                style={{ height: rowH, padding: "0 10px", fontSize: 12, borderBottom: "1px solid var(--border-hairline)" }}
              >
                <button
                  type="button"
                  title={row.data.pinned ? "Unpin" : "Pin to top"}
                  onClick={() => toggleScheduleActivityPin(projectNumber, row.data.id, !row.data.pinned)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    width: 20,
                    flexShrink: 0,
                    color: row.data.pinned ? "var(--accent-text)" : "var(--text-faint)",
                  }}
                >
                  📌
                </button>
                <span
                  style={{ width: 150, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  title={`${row.data.activityId} — ${row.data.name} (right-click for predecessor/successor)`}
                >
                  {row.data.name}
                  {(row.data.predecessorLinks.length > 0 || row.data.successorLinks.length > 0) && (
                    <span style={{ color: "var(--accent-text)", marginLeft: 4 }} title="Has schedule links">
                      ⛓
                    </span>
                  )}
                </span>
                <span className="mono" style={{ whiteSpace: "nowrap", color: "var(--text-faint)", flex: 1 }}>
                  {row.data.durationDays != null ? `${row.data.durationDays}d` : "—"}
                </span>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => removeScheduleActivity(projectNumber, row.data.id)}
                  style={{ all: "unset", cursor: "pointer", color: "var(--text-faint)", fontWeight: 700, padding: "0 2px" }}
                >
                  ×
                </button>
              </div>
            )
          )}
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ height: 28, background: "var(--bg-inset)", borderBottom: "1px solid var(--border)" }} />
          {rows.map((row, i) => {
            if (row.kind === "header") {
              return <div key={`h-${i}`} style={{ height: headerRowH, background: "var(--bg-inset)" }} />;
            }
            const a = row.data;
            const start = a.startAt?.getTime();
            const finish = a.finishAt?.getTime();
            if (start == null || finish == null) {
              return <div key={a.id} style={{ height: rowH, borderBottom: "1px solid var(--border-hairline)" }} />;
            }
            const pct = ((start - rangeMin) / rangeSpan) * 100;
            const endPct = ((finish - rangeMin) / rangeSpan) * 100;
            return (
              <div key={a.id} style={{ position: "relative", height: rowH, borderBottom: "1px solid var(--border-hairline)" }}>
                <div
                  title={`${a.startAt!.toLocaleDateString()} – ${a.finishAt!.toLocaleDateString()}`}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    width: `${Math.max(endPct - pct, 0.5)}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: Math.min(rowH - 16, 16),
                    borderRadius: "var(--r-pill)",
                    background: "var(--info-wash)",
                    border: "1px solid var(--info-fill)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      {hiddenCount > 0 && (
        <button type="button" className="btn btn--sm btn--gh mt-2" onClick={() => setExpanded(true)}>
          {`Expand (${hiddenCount} more)`}
        </button>
      )}
      {expanded && activities.length > COLLAPSE_LIMIT && (
        <button type="button" className="btn btn--sm btn--gh mt-2" onClick={() => setExpanded(false)}>
          Collapse
        </button>
      )}

      {menuActivity && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuFor(null)} onContextMenu={(e) => e.preventDefault()} />
          <div
            className="cmdk"
            style={{ position: "fixed", top: menuFor!.y, left: menuFor!.x, width: 300, zIndex: 41, padding: 14 }}
          >
            <div className="lbl" style={{ marginBottom: 8 }}>
              {menuActivity.name}
            </div>
            {(menuActivity.predecessorLinks.length > 0 || menuActivity.successorLinks.length > 0) && (
              <div className="flex flex-col gap-1" style={{ marginBottom: 10 }}>
                {menuActivity.predecessorLinks.map((l) => (
                  <div key={l.id} className="flex items-center justify-between" style={{ fontSize: 11.5 }}>
                    <span>
                      {l.type}: {l.activity.name} → this
                    </span>
                    <button
                      type="button"
                      className="btn btn--sm btn--gh"
                      onClick={() => removeScheduleRelationship(projectNumber, l.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {menuActivity.successorLinks.map((l) => (
                  <div key={l.id} className="flex items-center justify-between" style={{ fontSize: 11.5 }}>
                    <span>
                      {l.type}: this → {l.activity.name}
                    </span>
                    <button
                      type="button"
                      className="btn btn--sm btn--gh"
                      onClick={() => removeScheduleRelationship(projectNumber, l.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form
              action={async (fd) => {
                const role = String(fd.get("role"));
                const targetId = String(fd.get("targetId"));
                const type = String(fd.get("type")) as ScheduleRelType;
                if (!targetId) return;
                if (role === "predecessor") {
                  await addScheduleRelationship(projectNumber, targetId, menuActivity.id, type);
                } else {
                  await addScheduleRelationship(projectNumber, menuActivity.id, targetId, type);
                }
                setMenuFor(null);
              }}
              className="flex flex-col gap-2"
            >
              <select className="fld" name="role" defaultValue="predecessor">
                <option value="predecessor">This activity&apos;s predecessor is…</option>
                <option value="successor">This activity&apos;s successor is…</option>
              </select>
              <select className="fld" name="targetId" defaultValue="" required>
                <option value="" disabled>
                  — select activity —
                </option>
                {otherActivities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select className="fld" name="type" defaultValue="FS">
                <option value="FS">Finish-to-Start</option>
                <option value="SS">Start-to-Start</option>
              </select>
              <div className="flex gap-2">
                <button className="btn btn--sm btn--acc" type="submit">
                  Add
                </button>
                <button className="btn btn--sm btn--gh" type="button" onClick={() => setMenuFor(null)}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
