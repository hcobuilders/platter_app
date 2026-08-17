"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/login/actions";

type Status = { ok: boolean; uptimeSeconds: number } | null;

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  estimator: "Estimator",
  manager: "Manager",
  director: "Director",
  owner: "Owner",
  field: "Field",
  project_manager: "Project Manager",
  superintendent: "Superintendent",
  preconstruction_viewer: "Preconstruction Viewer",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AccountMenu({
  name,
  role,
  buildVersion,
}: {
  name: string;
  role: string;
  buildVersion: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ ok: false, uptimeSeconds: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        className="avatar"
        style={{ border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
      >
        {initials(name)}
      </button>
      {open && (
        <div className="pop" style={{ right: 0, top: "calc(100% + 4px)", minWidth: 200 }} onMouseLeave={() => setOpen(false)}>
          <div className="sec">{name}</div>
          <div style={{ padding: "2px 11px 9px", fontSize: 12, color: "var(--text-dim)" }}>{ROLE_LABEL[role] ?? role}</div>
          <hr />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 11px", fontSize: 12.5, color: "var(--text-faint)" }}>
            <span>Server status</span>
            {status ? (
              <span className="flex items-center gap-2" style={{ color: status.ok ? "var(--success-text)" : "var(--danger-text)" }}>
                <span className="dot" style={{ background: status.ok ? "var(--success-fill)" : "var(--danger-fill)" }} />
                {status.ok ? "OK" : "Down"}
              </span>
            ) : (
              <span>…</span>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 11px", fontSize: 12.5, color: "var(--text-faint)" }}>
            <span>Uptime</span>
            <span className="mono">{status ? formatUptime(status.uptimeSeconds) : "…"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 11px", fontSize: 12.5, color: "var(--text-faint)" }}>
            <span>Build</span>
            <span className="mono">v{buildVersion}</span>
          </div>
          <hr />
          <Link href="/settings?view=account" onClick={() => setOpen(false)}>
            Account settings
          </Link>
          <form action={logoutAction}>
            <button type="submit" style={{ color: "var(--danger-text)", width: "100%", textAlign: "left" }}>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
