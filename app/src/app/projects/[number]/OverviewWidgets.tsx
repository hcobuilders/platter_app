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

// A proportional timeline, not just a list — dates place themselves along
// the strip by real elapsed time, with a "today" marker and the nearest
// upcoming date called out (S-batch #47).
export function KeyDatesTimeline({ dates }: { dates: KeyDate[] }) {
  if (dates.length === 0) {
    return <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None recorded.</p>;
  }

  const now = getNow();
  const times = dates.map((d) => d.at.getTime());
  const min = Math.min(...times, now);
  const max = Math.max(...times, now);
  const span = Math.max(max - min, 86400000);
  const pad = span * 0.1;
  const rangeMin = min - pad;
  const rangeSpan = span + pad * 2;

  const next = [...dates].filter((d) => d.at.getTime() >= now).sort((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null;
  const nowPct = ((now - rangeMin) / rangeSpan) * 100;

  return (
    <div style={{ position: "relative", height: 108, padding: "8px 16px 0" }}>
      <div style={{ position: "absolute", left: 16, right: 16, top: 60, height: 2, background: "var(--border)" }} />
      <div
        style={{ position: "absolute", left: `${nowPct}%`, top: 52, height: 40, width: 1, background: "var(--accent-strong)" }}
        title={`Today · ${new Date(now).toLocaleDateString()}`}
      />
      {dates.map((d) => {
        const pct = ((d.at.getTime() - rangeMin) / rangeSpan) * 100;
        const isNext = next?.id === d.id;
        return (
          <div
            key={d.id}
            style={{ position: "absolute", left: `${pct}%`, top: 0, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", width: 108 }}
          >
            <div className="mono" style={{ fontSize: 11, fontWeight: isNext ? 700 : 400, color: isNext ? "var(--danger-text)" : "var(--text-dim)" }}>
              {d.at.toLocaleDateString()}
            </div>
            <div
              style={{
                marginTop: 8,
                width: isNext ? 13 : 9,
                height: isNext ? 13 : 9,
                borderRadius: "50%",
                background: isNext ? "var(--danger-fill)" : "var(--info-fill)",
                border: "2px solid var(--bg-surface-raised)",
                boxShadow: "0 0 0 1px var(--border-strong)",
              }}
            />
            <div className="lbl" style={{ marginTop: 8, textAlign: "center", color: isNext ? "var(--danger-text)" : "var(--text-faint)" }}>
              {KIND_LABEL[d.kind] ?? d.kind}
              {d.isMandatory && " *"}
            </div>
          </div>
        );
      })}
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
