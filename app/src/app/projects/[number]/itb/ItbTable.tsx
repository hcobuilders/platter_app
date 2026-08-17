"use client";

import { useTransition } from "react";
import {
  sendInvite,
  bulkSendInvites,
  updateInvitationIntent,
  removeInvitation,
  bulkRemoveInvitations,
} from "./actions";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { Checkbox } from "@/components/Checkbox";
import { RowMenu } from "@/components/RowMenu";
import { useTableSelection } from "@/components/useTableSelection";

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

export function ItbTable({
  projectNumber,
  invitations,
  footer,
}: {
  projectNumber: string;
  invitations: InvitationRow[];
  footer?: React.ReactNode;
}) {
  const [, startTransition] = useTransition();
  const { selected, toggle, toggleAll, clear, allSelected } = useTableSelection(invitations.map((i) => i.id));
  const ids = Array.from(selected);

  const columns: DataTableColumn[] = [
    { id: "sel", label: <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all" />, width: 38, minWidth: 38, resizable: false, icon: true },
    { id: "sub", label: "Subcontractor", width: 220 },
    { id: "trades", label: "Trades", width: 220 },
    { id: "status", label: "Status", width: 150 },
    { id: "sent", label: "Sent", width: 100 },
    { id: "actions", label: "", width: 44, minWidth: 44, resizable: false, icon: true },
  ];

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
            onClick={() =>
              startTransition(async () => {
                await bulkSendInvites(projectNumber, ids);
                clear();
              })
            }
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
                clear();
              });
            }}
          >
            Remove
          </button>
          <button className="btn btn--sm btn--gh" type="button" onClick={clear}>
            Clear
          </button>
        </div>
      )}

      <DataTable id="itb-tbl" columns={columns} footer={footer && <tr><td colSpan={columns.length}>{footer}</td></tr>}>
        {invitations.map((inv) => {
          const intent = INTENT_LABEL[inv.intent];
          return (
            <tr key={inv.id}>
              <td className="icon">
                <Checkbox checked={selected.has(inv.id)} onChange={() => toggle(inv.id)} aria-label={`Select ${inv.subcontractorName}`} />
              </td>
              <td>{inv.subcontractorName}</td>
              <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{inv.trades.join(", ")}</td>
              <td>
                <span className={intent.chip}>{intent.label}</span>
              </td>
              <td className="mono" style={{ fontSize: 12 }}>
                {inv.sentAt ? inv.sentAt.toLocaleDateString() : "—"}
              </td>
              <td className="icon">
                <RowMenu>
                  {(close) => (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          startTransition(() => sendInvite(projectNumber, inv.id));
                          close();
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
                            close();
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
                          close();
                        }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </RowMenu>
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
      </DataTable>
    </div>
  );
}
