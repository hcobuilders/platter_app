"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { setPackageSelfPerform } from "./actions";
import { RowMenu } from "@/components/RowMenu";
import { STATUS_META, type PackageStatusKind } from "./packageStatus";

export type PackageRow = {
  id: string;
  code: string;
  name: string;
  selfPerform: boolean;
  scopeLineCount: number;
  budgetAmount: bigint | null;
  statusKind: PackageStatusKind;
  invitations: { id: string; name: string; sentAt: Date | null; hasBid: boolean }[];
};

export function PackageStatusRow({ projectNumber, pkg }: { projectNumber: string; pkg: PackageRow }) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const meta = STATUS_META[pkg.statusKind];

  return (
    <>
      <tr>
        <td className="icon">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{ all: "unset", cursor: "pointer" }}
            aria-label={expanded ? "Collapse bidders" : "Expand bidders"}
          >
            <span className="carat">{expanded ? "▾" : "▸"}</span>
          </button>
        </td>
        <td className="mono">
          <Link href={`?package=${pkg.code}`} style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>
            {pkg.code}
          </Link>
        </td>
        <td>
          <Link href={`?package=${pkg.code}`} style={{ color: "inherit", textDecoration: "none" }}>
            {pkg.name}
          </Link>
        </td>
        <td>
          <span className="flex items-center gap-2">
            <span className="dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        </td>
        <td className="n">{pkg.scopeLineCount}</td>
        <td className="n">{pkg.invitations.length}</td>
        <td className="n">{formatCents(pkg.budgetAmount)}</td>
        <td className="icon">
          <RowMenu>
            {(close) => (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => setPackageSelfPerform(projectNumber, pkg.id, !pkg.selfPerform));
                  close();
                }}
              >
                {pkg.selfPerform ? "Unmark self-perform" : "Mark as self-perform"}
              </button>
            )}
          </RowMenu>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td></td>
          <td colSpan={7} style={{ padding: "2px 12px 14px" }}>
            {pkg.invitations.length === 0 ? (
              <span style={{ color: "var(--text-faint)", fontSize: 12 }}>No bidders invited yet.</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pkg.invitations.map((inv) => (
                  <span key={inv.id} className="chip">
                    {inv.name}
                    <span style={{ marginLeft: 6, color: "var(--text-faint)" }}>
                      {inv.hasBid ? "bid in" : inv.sentAt ? "awaiting" : "not sent"}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
