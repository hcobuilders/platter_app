"use client";

import { useState } from "react";
import { logoutAction } from "@/app/login/actions";

const ROLE_LABEL: Record<string, string> = {
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
          <button disabled title="Not wired up yet">
            Server status
          </button>
          <button disabled title="Not wired up yet">
            Uptime
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 11px", fontSize: 12.5, color: "var(--text-faint)" }}>
            <span>Build</span>
            <span className="mono">v{buildVersion}</span>
          </div>
          <hr />
          <button disabled title="Not wired up yet">
            Account settings
          </button>
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
