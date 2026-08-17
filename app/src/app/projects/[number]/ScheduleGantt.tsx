"use client";

import { useState } from "react";
import { removeScheduleActivity } from "./actions";

export type ScheduleActivityData = {
  id: string;
  activityId: string;
  name: string;
  wbsCategory: string | null;
  startAt: Date | null;
  finishAt: Date | null;
  durationDays: number | null;
};

const COLLAPSE_LIMIT = 10;

// "collapse this container to be no more than 10 rows unless the user
// clicks expand" (S-batch #63). Same left-pane-table / right-pane-chart
// language as GanttTimeline (#62), but every row here is a real
// start→finish span from the imported P6 file rather than a milestone.
export function ScheduleGantt({ projectNumber, activities }: { projectNumber: string; activities: ScheduleActivityData[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? activities : activities.slice(0, COLLAPSE_LIMIT);

  if (activities.length === 0) {
    return <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No schedule imported yet.</p>;
  }

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

  return (
    <div>
      <div className="flex" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid var(--border)" }}>
          <div
            className="lbl flex items-center"
            style={{ height: 28, padding: "0 10px", background: "var(--bg-inset)", borderBottom: "1px solid var(--border)" }}
          >
            <span style={{ width: 150, flexShrink: 0 }}>Activity</span>
            <span style={{ width: 90, flexShrink: 0 }}>WBS</span>
            <span style={{ whiteSpace: "nowrap" }}>Duration</span>
          </div>
          {visible.map((a) => (
            <div
              key={a.id}
              className="flex items-center"
              style={{ height: rowH, padding: "0 10px", fontSize: 12, borderBottom: "1px solid var(--border-hairline)" }}
            >
              <span
                style={{ width: 150, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                title={`${a.activityId} — ${a.name}`}
              >
                {a.name}
              </span>
              <span
                style={{
                  width: 90,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "var(--text-dim)",
                }}
              >
                {a.wbsCategory ?? "—"}
              </span>
              <span className="mono" style={{ whiteSpace: "nowrap", color: "var(--text-faint)", flex: 1 }}>
                {a.durationDays != null ? `${a.durationDays}d` : "—"}
              </span>
              <button
                type="button"
                title="Remove"
                onClick={() => removeScheduleActivity(projectNumber, a.id)}
                style={{ all: "unset", cursor: "pointer", color: "var(--text-faint)", fontWeight: 700, padding: "0 2px" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ height: 28, background: "var(--bg-inset)", borderBottom: "1px solid var(--border)" }} />
          {visible.map((a) => {
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
      {activities.length > COLLAPSE_LIMIT && (
        <button type="button" className="btn btn--sm btn--gh mt-2" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Collapse" : `Expand (${activities.length - COLLAPSE_LIMIT} more)`}
        </button>
      )}
    </div>
  );
}
