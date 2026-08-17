"use client";

import { useState } from "react";
import { removeScheduleActivity, toggleScheduleActivityPin } from "./actions";

export type ScheduleActivityData = {
  id: string;
  activityId: string;
  name: string;
  wbsCategory: string | null;
  startAt: Date | null;
  finishAt: Date | null;
  durationDays: number | null;
  pinned: boolean;
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
  // Drop any trailing header that ended up with no rows under it once
  // truncated.
  while (limited.length > 0 && limited[limited.length - 1].kind === "header") limited.pop();

  const totalActivities = pinned.length + unpinned.length;
  return { rows: limited, hiddenCount: totalActivities - activityCount };
}

// "collapse this container to be no more than 10 rows unless the user
// clicks expand" (S-batch #63). Same left-pane-table / right-pane-chart
// language as GanttTimeline (#62), but every row here is a real
// start→finish span from the imported P6 file rather than a milestone.
export function ScheduleGantt({ projectNumber, activities }: { projectNumber: string; activities: ScheduleActivityData[] }) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) {
    return <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No schedule imported yet.</p>;
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
  const rowH = 30;
  const headerRowH = 24;

  return (
    <div>
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
                  title={`${row.data.activityId} — ${row.data.name}`}
                >
                  {row.data.name}
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
                    height: 12,
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
    </div>
  );
}
