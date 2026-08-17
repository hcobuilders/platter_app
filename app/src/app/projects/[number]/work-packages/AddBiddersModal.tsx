"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { inviteSubcontractor } from "./itb-actions";

type SubOption = { id: string; name: string; trades: string[]; csiMatch: boolean };

// Window-style control per S-batch #68 — auto-filters to subs whose
// csiCodes overlap the package's own csiCodes (CSI matches surface first,
// everything else stays reachable below rather than being hidden, since
// most of today's seed subcontractors don't carry csiCodes yet).
export function AddBiddersModal({
  projectNumber,
  bidPackageId,
  packageCode,
  availableSubs,
}: {
  projectNumber: string;
  bidPackageId: string;
  packageCode: string;
  availableSubs: SubOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("addBidders") === "1";
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  if (!open) return null;

  function close() {
    router.push(`?package=${packageCode}`);
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? availableSubs.filter((s) => s.name.toLowerCase().includes(q) || s.trades.some((t) => t.toLowerCase().includes(q)))
    : availableSubs;
  const matched = filtered.filter((s) => s.csiMatch);
  const other = filtered.filter((s) => !s.csiMatch);

  async function invite(subcontractorId: string) {
    setPending(subcontractorId);
    const fd = new FormData();
    fd.set("existingSubcontractorId", subcontractorId);
    await inviteSubcontractor(projectNumber, bidPackageId, fd);
    setPending(null);
  }

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk" style={{ maxWidth: 480 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            Add bidders — {packageCode}
          </div>
          <input
            className="fld"
            placeholder="Search subcontractors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto", padding: "12px 18px" }}>
          {matched.length > 0 && (
            <>
              <div className="lbl" style={{ margin: "0 0 6px", color: "var(--accent-text)" }}>
                Matches this package&apos;s CSI codes
              </div>
              {matched.map((s) => (
                <SubRow key={s.id} sub={s} pending={pending === s.id} onInvite={() => invite(s.id)} />
              ))}
            </>
          )}
          {other.length > 0 && (
            <>
              <div className="lbl" style={{ margin: matched.length ? "14px 0 6px" : "0 0 6px" }}>
                All subcontractors
              </div>
              {other.map((s) => (
                <SubRow key={s.id} sub={s} pending={pending === s.id} onInvite={() => invite(s.id)} />
              ))}
            </>
          )}
          {filtered.length === 0 && (
            <p style={{ color: "var(--text-faint)", fontSize: 12.5 }}>No subcontractors match.</p>
          )}
        </div>
        <form
          action={async (fd) => {
            await inviteSubcontractor(projectNumber, bidPackageId, fd);
          }}
          className="flex items-center gap-2"
          style={{ padding: 18, borderTop: "1px solid var(--border-hairline)", flexWrap: "wrap" }}
        >
          <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>or new —</span>
          <input className="fld" name="newSubName" placeholder="Name" style={{ width: 160 }} />
          <input className="fld" name="newSubTrade" placeholder="Trade" style={{ width: 130 }} />
          <button className="btn btn--sm" type="submit">
            + Add &amp; invite
          </button>
          <button className="btn btn--sm btn--gh" type="button" onClick={close} style={{ marginLeft: "auto" }}>
            Done
          </button>
        </form>
      </div>
    </div>
  );
}

function SubRow({ sub, pending, onInvite }: { sub: SubOption; pending: boolean; onInvite: () => void }) {
  return (
    <div className="cclist">
      <span>
        {sub.name}
        {sub.trades.length > 0 && <span style={{ color: "var(--text-faint)", marginLeft: 8 }}>{sub.trades.join(", ")}</span>}
      </span>
      <button className="btn btn--sm" type="button" disabled={pending} onClick={onInvite}>
        {pending ? "Adding…" : "+ Invite"}
      </button>
    </div>
  );
}
