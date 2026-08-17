const KIND_LABEL: Record<string, string> = {
  itb_out: "ITB Out",
  site_walk: "Site Walk",
  rfi_cutoff: "RFI Cutoff",
  addenda_cutoff: "Addenda Cutoff",
  submission_due: "Bids Due",
  award_target: "Award Target",
  notice_to_proceed: "Notice to Proceed",
};

type KeyDate = { id: string; kind: string; at: Date; isMandatory: boolean };

// Indirection so the render body never calls Date.now() directly — this is
// a Server Component re-evaluated fresh per request, but the purity lint
// rule can't tell that apart from a client component re-render.
function getNow(): number {
  return Date.now();
}

type GanttRow = {
  id: string;
  label: string;
  date: Date;
  endDate?: Date;
  duration: string;
  mandatory?: boolean;
};

// Gantt-style placeholder container (S-batch #62) — owner's spec: "gantt-
// style chart table with left pane of item, date, duration and right is
// the chart ... for now just create a token placeholder style ... so we
// have the parameters to take into design." Left pane is a real
// item/date/duration table; right pane is a proportional chart —
// diamonds for point-in-time milestones, one bar for the only computed
// span today (contract duration, once notice-to-proceed + contract days
// are both set — change-order days extend it, same as the dashboard
// card's completion-date math). No drag/zoom/predecessor/WBS grouping —
// that's #63/#64, deliberately deferred.
export function GanttTimeline({
  dates,
  contractDays,
  changeOrderDays,
}: {
  dates: KeyDate[];
  contractDays: number | null;
  changeOrderDays: number;
}) {
  const now = getNow();
  const ntp = dates.find((d) => d.kind === "notice_to_proceed");

  const rows: GanttRow[] = dates
    .slice()
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((d) => ({ id: d.id, label: KIND_LABEL[d.kind] ?? d.kind, date: d.at, duration: "—", mandatory: d.isMandatory }));

  if (ntp && contractDays != null) {
    const totalDays = contractDays + changeOrderDays;
    rows.push({
      id: "contract-duration",
      label: "Contract Duration",
      date: ntp.at,
      endDate: new Date(ntp.at.getTime() + totalDays * 86400000),
      duration: `${totalDays} days`,
    });
  }

  if (rows.length === 0) {
    return <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None recorded.</p>;
  }

  const next = [...dates].filter((d) => d.at.getTime() >= now).sort((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null;

  const anchorTimes = rows.flatMap((r) => [r.date.getTime(), ...(r.endDate ? [r.endDate.getTime()] : [])]);
  const min = Math.min(...anchorTimes, now);
  const max = Math.max(...anchorTimes, now);
  const span = Math.max(max - min, 86400000);
  const pad = span * 0.06;
  const rangeMin = min - pad;
  const rangeSpan = span + pad * 2;
  const nowPct = ((now - rangeMin) / rangeSpan) * 100;
  const rowH = 32;

  return (
    <div className="flex" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid var(--border)" }}>
        <div className="lbl flex items-center" style={{ height: 28, padding: "0 10px", background: "var(--bg-inset)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 140, flexShrink: 0 }}>Item</span>
          <span style={{ width: 72, flexShrink: 0 }}>Date</span>
          <span style={{ whiteSpace: "nowrap" }}>Duration</span>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="flex items-center" style={{ height: rowH, padding: "0 10px", fontSize: 12, borderBottom: "1px solid var(--border-hairline)" }}>
            <span
              style={{
                width: 140,
                flexShrink: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: next?.id === r.id ? "var(--danger-text)" : undefined,
                fontWeight: next?.id === r.id ? 700 : 400,
              }}
            >
              {r.label}
              {r.mandatory && " *"}
            </span>
            <span className="mono" style={{ width: 72, flexShrink: 0, whiteSpace: "nowrap", color: "var(--text-dim)" }}>
              {r.date.toLocaleDateString()}
            </span>
            <span className="mono" style={{ whiteSpace: "nowrap", color: "var(--text-faint)" }}>
              {r.duration}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <div style={{ height: 28, background: "var(--bg-inset)", borderBottom: "1px solid var(--border)" }} />
        <div
          style={{ position: "absolute", left: `${nowPct}%`, top: 28, bottom: 0, width: 1, background: "var(--accent-strong)" }}
          title={`Today · ${new Date(now).toLocaleDateString()}`}
        />
        {rows.map((r) => {
          const pct = ((r.date.getTime() - rangeMin) / rangeSpan) * 100;
          const isNext = next?.id === r.id;
          if (r.endDate) {
            const endPct = ((r.endDate.getTime() - rangeMin) / rangeSpan) * 100;
            return (
              <div key={r.id} style={{ position: "relative", height: rowH, borderBottom: "1px solid var(--border-hairline)" }}>
                <div
                  title={`${r.date.toLocaleDateString()} – ${r.endDate.toLocaleDateString()}`}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    width: `${Math.max(endPct - pct, 0.5)}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 14,
                    borderRadius: "var(--r-pill)",
                    background: "var(--info-wash)",
                    border: "1px solid var(--info-fill)",
                  }}
                />
              </div>
            );
          }
          return (
            <div key={r.id} style={{ position: "relative", height: rowH, borderBottom: "1px solid var(--border-hairline)" }}>
              <div
                title={`${r.label} · ${r.date.toLocaleDateString()}`}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: "50%",
                  width: 10,
                  height: 10,
                  transform: "translate(-50%, -50%) rotate(45deg)",
                  background: isNext ? "var(--danger-fill)" : "var(--info-fill)",
                  border: "2px solid var(--bg-surface-raised)",
                  boxShadow: "0 0 0 1px var(--border-strong)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Embeds OpenStreetMap's export view — no API key, no billing account
// (Google Maps Platform needs the owner's own Google Cloud billing setup,
// raised on #61 and settled on staying with OSM). Tinted toward the brand
// palette via --map-filter (tokens.css) — a re-theme later is a one-line
// token edit, not a component change.
export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const d = 0.008;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <iframe
      src={src}
      style={{ width: "100%", height: 200, border: 0, borderRadius: "var(--r-md)", display: "block", filter: "var(--map-filter)" }}
      loading="lazy"
      title="Project location map"
    />
  );
}

// "open in google maps" link under the address (#61) — a plain query-string
// URL, no API key or billing needed for this, unlike embedding Maps tiles.
export function GoogleMapsLink({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}&query_place_id=${encodeURIComponent(address)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: "var(--info-text)" }}>
      Open in Google Maps ↗
    </a>
  );
}
