"use client";

import { useState } from "react";
import Link from "next/link";
import { ItbTable } from "./ItbTable";

type InvitationRow = {
  id: string;
  subcontractorName: string;
  trades: string[];
  intent: "none" | "bidding" | "no_bid";
  sentAt: Date | null;
  openedAt: Date | null;
  hasBid: boolean;
};

// Collapsed by default per S-batch #68 — ITB is no longer a standalone
// tool page, it's a hero element inside the work package it belongs to.
export function ItbHero({
  projectNumber,
  packageCode,
  invitations,
}: {
  projectNumber: string;
  packageCode: string;
  invitations: InvitationRow[];
}) {
  const [expanded, setExpanded] = useState(false);

  const total = invitations.length;
  const submitted = invitations.filter((i) => i.hasBid).length;
  const opened = invitations.filter((i) => i.openedAt).length;
  const notBidding = invitations.filter((i) => i.intent === "no_bid").length;

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <span className="flex items-center gap-2">
          <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
            {expanded ? "▾" : "▸"}
          </span>
          <span style={{ font: "600 14px var(--font-display)" }}>Invited bidders — {total}</span>
        </span>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
          {submitted} submitted · {opened} opened · {notBidding} not bidding
        </span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex justify-end">
            <Link href={`?package=${packageCode}&addBidders=1`} className="btn btn--sm btn--acc">
              + Add bidders
            </Link>
          </div>
          <ItbTable projectNumber={projectNumber} invitations={invitations} />
          <p style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
            Sending is stubbed for this prototype — production swaps this for Microsoft Graph{" "}
            <span className="mono">sendMail</span> behind the <span className="mono">Mailer</span> interface (D-14).
          </p>
        </div>
      )}
    </div>
  );
}
