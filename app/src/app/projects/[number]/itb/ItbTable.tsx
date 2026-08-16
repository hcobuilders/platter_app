"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  sendInvite,
  bulkSendInvites,
  updateInvitationIntent,
  removeInvitation,
  bulkRemoveInvitations,
} from "./actions";
import { ResizableColumns } from "@/components/ResizableColumns";

type InvitationRow = {
  id: string;
  subcontractorName: string;
  trades: string[];
  intent: "none" | "bidding" | "no_bid";
  sentAt: Date | null;
};

const INTENT_LABEL: Record<string, { label: string; chip: string }> = {
  none: { label: "Awaiting response", chip: "chip" },
  bidding: { label: "Bidding", chip: "chip chip--ok" },
  no_bid: { label: "No bid", chip: "chip chip--dgr" },
};

export function ItbTable({ projectNumber, invitations }: { projectNumber: string; invitations: InvitationRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === invitations.length ? new Set() : new Set(invitations.map((i) => i.id))));
  }

  const allSelected = invitations.length > 0 && selected.size === invitations.length;
  const ids = Array.from(selected);

  return (
    <div>
      {selected.size > 0 && (
        <div
          className="flex items-center gap-2"
          style={{ marginBottom: 10, padding: "8px 10px", background: "var(--bg-inset)", borderRadius: "var(--r-sm)" }}
        >
          <span style={{ fontSize: 12.5, color: "var(--text-dim)", marginRight: 4 }}>{selected.size} selected</span>
          <button
            className="btn btn--sm btn--acc"
            type="button"
            onClick={() => startTransition(async () => {
              await bulkSendInvites(projectNumber, ids);
              setSelected(new Set());
            })}
          >
            Send / resend ITB
          </button>
          <button
            className="btn btn--sm btn--gh"
            type="button"
            style={{ color: "var(--danger-text)" }}
            onClick={() => {
              if (!confirm(`Remove ${selected.size} invitation(s)? This also removes any bids submitted under them.`)) return;
              startTransition(async () => {
                await bulkRemoveInvitations(projectNumber, ids);
                setSelected(new Set());
              });
            }}
          >
            Remove
          </button>
          <button className="btn btn--sm btn--gh" type="button" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      <ResizableColumns tableId="itb-tbl" />
      <div className="bwrap">
      <table className="tbl" id="itb-tbl">
        <thead>
          <tr>
            <th style={{ width: 30 }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
            </th>
            <th>Subcontractor</th>
            <th>Trades</th>
            <th>Status</th>
            <th>Sent</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => {
            const intent = INTENT_LABEL[inv.intent];
            return (
              <tr key={inv.id}>
                <td>
                  <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggle(inv.id)} aria-label={`Select ${inv.subcontractorName}`} />
                </td>
                <td>{inv.subcontractorName}</td>
                <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{inv.trades.join(", ")}</td>
                <td>
                  <span className={intent.chip}>{intent.label}</span>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {inv.sentAt ? inv.sentAt.toLocaleDateString() : "—"}
                </td>
                <td style={{ position: "relative" }}>
                  <button
                    className="btn btn--sm btn--gh"
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                    aria-label="Row actions"
                  >
                    ⋮
                  </button>
                  {openMenuId === inv.id && (
                    <div ref={menuRef} className="rowmenu">
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(() => sendInvite(projectNumber, inv.id));
                          setOpenMenuId(null);
                        }}
                      >
                        {inv.sentAt ? "Resend ITB" : "Send ITB"}
                      </button>
                      <div className="rowmenu__label">Mark as</div>
                      {(["bidding", "no_bid", "none"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          disabled={inv.intent === k}
                          onClick={() => {
                            startTransition(() => updateInvitationIntent(projectNumber, inv.id, k));
                            setOpenMenuId(null);
                          }}
                        >
                          {INTENT_LABEL[k].label}
                        </button>
                      ))}
                      <div className="rowmenu__sep" />
                      <button
                        type="button"
                        style={{ color: "var(--danger-text)" }}
                        onClick={() => {
                          if (!confirm(`Remove ${inv.subcontractorName}? This also removes any bids submitted under this invitation.`)) return;
                          startTransition(() => removeInvitation(projectNumber, inv.id));
                          setOpenMenuId(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {invitations.length === 0 && (
            <tr>
              <td colSpan={6} style={{ color: "var(--text-faint)" }}>
                No invitations yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
