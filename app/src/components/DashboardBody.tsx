"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { setDashboardStatusFilters, archiveProject, unarchiveProject, saveProjectAsTemplate } from "@/app/actions";
import { StatusPill } from "@/components/StatusPill";
import type { ProjectStatus } from "@/generated/prisma/enums";

export type CardProject = {
  number: string;
  name: string;
  status: string;
  address: string | null;
  packageCount: number;
  quotedCount: number;
  unresolvedCount: number;
  budgetTotal: number;
  budgetVerified: boolean;
  itbOut: string | null;
  siteWalk: string | null;
  siteWalkMandatory: boolean;
  bidsDue: string | null;
  awardTarget: string | null;
  archivedAt: string | null;
};


function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

function shortLocation(address: string | null): string {
  if (!address) return "—";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  return address;
}

function GlyphBudget() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </svg>
  );
}
function GlyphInvite() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="2" y="5" width="15" height="12" rx="2" />
      <path d="m2 7 7.5 5L17 7M19 15v6M22 18h-6" />
    </svg>
  );
}
function GlyphBidTab() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4.8A8.4 8.4 0 1 1 21 11.5Z" />
      <path d="M8.5 11h7M8.5 14.5h4" />
    </svg>
  );
}
function GlyphDocs() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2.5h5.5A2.5 2.5 0 0 1 20 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" />
      <path d="M9 13h6" />
    </svg>
  );
}

function Card({ p }: { p: CardProject }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [, startTransition] = useTransition();
  const dueDays = daysUntil(p.bidsDue);
  const isOpenStage = !["awarded", "lost"].includes(p.status);
  const urgent = isOpenStage && dueDays !== null && dueDays <= 2;
  const overdue = isOpenStage && dueDays !== null && dueDays < 0;
  const isClosed = p.status === "awarded" || p.status === "lost";
  const isDraft = p.status === "draft";
  const isArchived = p.archivedAt !== null;

  const cls = ["pc", urgent || overdue ? "is-urgent" : "", isDraft ? "is-draft" : "", isClosed ? "is-closed" : ""].filter(Boolean).join(" ");

  return (
    <article className={cls} style={{ position: "relative" }}>
      <div className="pc__hd">
        <div style={{ minWidth: 0 }}>
          <Link href={`/projects/${p.number}`} className="pc__name">
            {p.name}
          </Link>
          <div className="pc__meta" title={p.address ?? undefined}>
            {p.number} · {shortLocation(p.address)}
          </div>
        </div>
        <div className="pc__tags">
          <div className="flex items-center gap-2" style={{ position: "relative" }}>
            <StatusPill projectNumber={p.number} status={p.status as ProjectStatus} />
            <button className="kebab" onClick={() => setMenuOpen((v) => !v)} aria-label="Project actions">
              ⋯
            </button>
            {menuOpen && (
              <div className="pop" style={{ right: 0, top: "calc(100% + 4px)" }} onMouseLeave={() => setMenuOpen(false)}>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    startTransition(() => {
                      saveProjectAsTemplate(p.number);
                    });
                    setTemplateSaved(true);
                  }}
                >
                  Duplicate as template
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    startTransition(() => {
                      if (isArchived) unarchiveProject(p.number);
                      else archiveProject(p.number);
                    });
                  }}
                >
                  {isArchived ? "Unarchive project" : "Archive project"}
                </button>
                <hr />
                <div className="sec">Open in</div>
                <button disabled title="Not connected">
                  Procore ↗
                </button>
                <button disabled title="Not connected">
                  SharePoint ↗
                </button>
                <button disabled title="Not connected">
                  Consight ↗
                </button>
              </div>
            )}
          </div>
          {isDraft && p.unresolvedCount > 0 && <span className="chip">{p.unresolvedCount} unresolved</span>}
          {templateSaved && <span className="chip chip--ok">Template saved</span>}
        </div>
      </div>

      <dl className="pc__dates">
        <div>
          <dt>ITB out</dt>
          <dd style={!p.itbOut ? { color: "var(--text-faint)" } : undefined}>{fmtDate(p.itbOut)}</dd>
        </div>
        <div>
          <dt>Site walk</dt>
          <dd style={!p.siteWalk ? { color: "var(--text-faint)" } : undefined}>
            {fmtDate(p.siteWalk)}
            {p.siteWalkMandatory && <small style={{ color: "var(--danger-text)" }}>Mandatory</small>}
          </dd>
        </div>
        <div>
          <dt>Bids due</dt>
          <dd className={urgent || overdue ? "due" : undefined} style={!p.bidsDue ? { color: "var(--text-faint)" } : undefined}>
            {fmtDate(p.bidsDue)}
            {dueDays !== null && isOpenStage && (
              <small style={urgent || overdue ? { color: "var(--danger-text)" } : undefined}>
                {overdue ? `closed ${Math.abs(dueDays)}d ago` : dueDays === 0 ? "today" : `in ${dueDays} days`}
              </small>
            )}
          </dd>
        </div>
        <div>
          <dt>Packages</dt>
          <dd>
            {p.packageCount}
            <small>{p.quotedCount} quoted</small>
          </dd>
        </div>
      </dl>

      <div className="pc__band">
        <Link href={`/projects/${p.number}/budget`} title="Budget">
          <GlyphBudget />
        </Link>
        <Link href={`/projects/${p.number}/work-packages`} title="Invite bidders">
          <GlyphInvite />
        </Link>
        <Link href={`/projects/${p.number}/bid-tab`} title="Bid tab">
          <GlyphBidTab />
        </Link>
        <span className="disabled" title="Documents — not built yet">
          <GlyphDocs />
        </span>
      </div>

      <div className="pc__ft">
        <span className={`v ${p.budgetVerified ? "src-verified" : "src-ai"}`}>{formatCents(p.budgetTotal)}</span>
      </div>
    </article>
  );
}

// Archived projects are hidden unless the "Archived" chip is explicitly
// checked (S-batch #72) — matches how archiving is expected to work
// everywhere else: out of the way by default, not deleted.
const FILTER_MATCH: Record<string, (p: CardProject) => boolean> = {
  active: (p) => !p.archivedAt && !["awarded", "lost"].includes(p.status),
  draft: (p) => !p.archivedAt && p.status === "draft",
  closed: (p) => !p.archivedAt && (p.status === "awarded" || p.status === "lost"),
  archived: (p) => p.archivedAt !== null,
};

export function DashboardBody({ projects, initialStatusFilters }: { projects: CardProject[]; initialStatusFilters: string[] }) {
  const [view, setView] = useState<"cards" | "rows">("cards");
  const [statusFilters, setStatusFilters] = useState<Set<string>>(() => new Set(initialStatusFilters));
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  function toggleFilter(key: string) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      startTransition(() => {
        setDashboardStatusFilters([...next]);
      });
      return next;
    });
  }

  const activeCount = projects.filter(FILTER_MATCH.active).length;
  const draftCount = projects.filter(FILTER_MATCH.draft).length;
  const closedCount = projects.filter(FILTER_MATCH.closed).length;
  const archivedCount = projects.filter(FILTER_MATCH.archived).length;

  // Multi-select: any project matching at least one checked filter shows —
  // e.g. Active + Draft together, or Closed + Draft together (per the
  // owner's own examples). No filters checked shows everything EXCEPT
  // archived projects, which stay hidden until "Archived" is checked.
  let filtered =
    statusFilters.size > 0
      ? projects.filter((p) => [...statusFilters].some((key) => FILTER_MATCH[key]?.(p)))
      : projects.filter((p) => !p.archivedAt);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.number.toLowerCase().includes(q));
  }

  const sorted = [...filtered].sort((a, b) => {
    const da = a.bidsDue ? new Date(a.bidsDue).getTime() : Infinity;
    const db = b.bidsDue ? new Date(b.bidsDue).getTime() : Infinity;
    return da - db;
  });

  return (
    <div className="frame" style={{ background: "var(--bg-surface)" }}>
      <div className="dtoolbar">
        <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
          <button className="fchip" aria-pressed={statusFilters.has("active")} onClick={() => toggleFilter("active")}>
            Active · {activeCount}
          </button>
          <button className="fchip" aria-pressed={statusFilters.has("draft")} onClick={() => toggleFilter("draft")}>
            Draft · {draftCount}
          </button>
          <button className="fchip" aria-pressed={statusFilters.has("closed")} onClick={() => toggleFilter("closed")}>
            Closed · {closedCount}
          </button>
          {archivedCount > 0 && (
            <button className="fchip" aria-pressed={statusFilters.has("archived")} onClick={() => toggleFilter("archived")}>
              Archived · {archivedCount}
            </button>
          )}
          {search && (
            <span className="chip chip--acc">
              &quot;{search}&quot; <span style={{ opacity: 0.55, cursor: "pointer" }} onClick={() => setSearch("")}>✕</span>
            </span>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <input
            className="fld"
            style={{ width: 180 }}
            placeholder="Filter by name or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="lbl">Sort</span>
          <span className="chip chip--info">Bids due ↑</span>
          <div className="seg">
            <button aria-pressed={view === "cards"} onClick={() => setView("cards")}>
              Cards
            </button>
            <button aria-pressed={view === "rows"} onClick={() => setView("rows")}>
              Rows
            </button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <h4>No projects yet</h4>
          <p>Drop a set of RFP documents and Platter will fill in what it can.</p>
          <Link href="/?new=1" className="btn btn--pri">
            New project
          </Link>
        </div>
      ) : view === "cards" ? (
        <div className="grid">
          {sorted.map((p) => (
            <Card key={p.number} p={p} />
          ))}
        </div>
      ) : (
        <div className="rows">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th className="n">Bids due</th>
                <th className="n">Pkgs</th>
                <th className="n">Budget</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const dueDays = daysUntil(p.bidsDue);
                const isOpenStage = !["awarded", "lost"].includes(p.status);
                const urgent = isOpenStage && dueDays !== null && dueDays <= 2;
                return (
                  <tr key={p.number}>
                    <td>
                      <Link href={`/projects/${p.number}`} style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}>
                        {p.name}
                      </Link>{" "}
                      <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-data)", fontSize: 11 }}>{p.number}</span>
                    </td>
                    <td>
                      <StatusPill projectNumber={p.number} status={p.status as ProjectStatus} />
                    </td>
                    <td className="n" style={urgent ? { color: "var(--danger-text)", fontWeight: 700 } : undefined}>
                      {fmtDate(p.bidsDue)}
                      {dueDays !== null ? ` · ${dueDays}d` : ""}
                    </td>
                    <td className="n">{p.packageCount}</td>
                    <td className="n">{formatCents(p.budgetTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
