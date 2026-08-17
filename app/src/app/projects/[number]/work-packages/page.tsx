import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { formatCents } from "@/lib/format";
import { ItbHero } from "./ItbHero";
import { AddBiddersModal } from "./AddBiddersModal";
import { ScopeWorksheetTable } from "./ScopeWorksheetTable";
import { PackageStatusRow } from "./PackageStatusRow";
import { computePackageStatus, STATUS_META, type PackageStatusKind } from "./packageStatus";

export const dynamic = "force-dynamic";

async function getPackages(number: string) {
  const project = await prisma.project.findUnique({
    where: { number },
    include: {
      bidPackages: {
        include: {
          scopeLineItems: { orderBy: { seq: "asc" } },
          invitations: {
            include: { subcontractor: true, bids: { select: { id: true }, take: 1 } },
            orderBy: { sentAt: "asc" },
          },
          budgetLines: { select: { awardedTo: true } },
        },
      },
    },
  });
  return project;
}

type SortKey = "code" | "name" | "lines" | "subs" | "budget";

function sortPackages<T extends { code: string; name: string; scopeLineItems: unknown[]; invitations: unknown[]; budgetAmount: bigint | null }>(
  pkgs: T[],
  sort: SortKey,
  dir: "asc" | "desc"
): T[] {
  const sorted = [...pkgs].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name);
      case "lines":
        return a.scopeLineItems.length - b.scopeLineItems.length;
      case "subs":
        return a.invitations.length - b.invitations.length;
      case "budget":
        return Number((a.budgetAmount ?? 0n) - (b.budgetAmount ?? 0n));
      case "code":
      default:
        return a.code.localeCompare(b.code);
    }
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

function sortHeader(label: string, key: SortKey, activeSort: SortKey, dir: "asc" | "desc") {
  const isActive = activeSort === key;
  const nextDir = isActive && dir === "asc" ? "desc" : "asc";
  return (
    <Link href={`?sort=${key}&dir=${nextDir}`} style={{ color: "inherit", textDecoration: "none" }}>
      {label}
      {isActive && <span style={{ marginLeft: 4, opacity: 0.6 }}>{dir === "asc" ? "↑" : "↓"}</span>}
    </Link>
  );
}

// Division-prefix overlap ("07 21 00" -> "07") — forgiving on purpose since
// most seed subcontractors don't carry precise multi-level CSI codes yet.
function csiDivision(code: string): string {
  return code.trim().split(/\s+/)[0] ?? code;
}

export default async function WorkPackagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ package?: string; addBidders?: string; sort?: string; dir?: string }>;
}) {
  const { number } = await params;
  const { package: packageCode, sort, dir } = await searchParams;
  const project = await getPackages(number);
  if (!project) notFound();

  if (project.bidPackages.length === 0) {
    return <p style={{ color: "var(--text-dim)" }}>No bid packages yet.</p>;
  }

  // Default landing view: the app's anchor screen (S-batch #69) — global
  // stats, a sortable/expandable package status list. Drilling into one
  // (via ?package=) opens the tabs-on-top, full-screen editor below.
  if (!packageCode) {
    const sortKey: SortKey = (["code", "name", "lines", "subs", "budget"] as const).includes(sort as SortKey)
      ? (sort as SortKey)
      : "code";
    const sortDir: "asc" | "desc" = dir === "desc" ? "desc" : "asc";

    const rows = project.bidPackages.map((p) => ({
      ...p,
      statusKind: computePackageStatus({
        status: p.status,
        selfPerform: p.selfPerform,
        dueAt: p.dueAt,
        scopeLineCount: p.scopeLineItems.length,
        invitations: p.invitations.map((i) => ({ sentAt: i.sentAt, hasBid: i.bids.length > 0 })),
        hasAward: p.budgetLines.some((b) => b.awardedTo),
      }),
    }));
    const sorted = sortPackages(rows, sortKey, sortDir);

    const totalBudget = project.bidPackages.reduce((s, p) => s + (p.budgetAmount ?? 0n), 0n);
    const statusCounts = rows.reduce(
      (acc, r) => {
        acc[r.statusKind] = (acc[r.statusKind] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<PackageStatusKind, number>>
    );

    const packageColumns: DataTableColumn[] = [
      { id: "expand", label: "", width: 34, minWidth: 34, resizable: false, icon: true },
      { id: "code", label: sortHeader("Code", "code", sortKey, sortDir), width: 100 },
      { id: "name", label: sortHeader("Name", "name", sortKey, sortDir), width: 240 },
      { id: "status", label: "Status", width: 140 },
      { id: "lines", label: sortHeader("Scope lines", "lines", sortKey, sortDir), width: 110, align: "right" },
      { id: "subs", label: sortHeader("Invited subs", "subs", sortKey, sortDir), width: 110, align: "right" },
      {
        id: "budget",
        label: (
          <Link href={`/projects/${number}/budget`} style={{ color: "inherit", textDecoration: "none" }}>
            Budget
          </Link>
        ),
        width: 130,
        align: "right",
      },
      { id: "actions", label: "", width: 44, minWidth: 44, resizable: false, icon: true },
    ];

    return (
      <div className="flex flex-col gap-5">
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>
            Project stats
          </div>
          <div className="flex flex-wrap gap-6">
            <Stat label="Packages" value={String(project.bidPackages.length)} />
            <Stat label="Total budget" value={formatCents(totalBudget)} />
            <Stat label="Out for bid" value={String(statusCounts.out_for_bid ?? 0)} color={STATUS_META.out_for_bid.color} />
            <Stat label="Complete" value={String(statusCounts.complete ?? 0)} color={STATUS_META.complete.color} />
            <Stat label="No response" value={String(statusCounts.no_response ?? 0)} color={STATUS_META.no_response.color} />
            <Stat label="Self-perform" value={String(statusCounts.self_perform ?? 0)} />
            <Stat label="Scope gaps" value={String(statusCounts.error ?? 0)} color={STATUS_META.error.color} />
          </div>
        </div>

        <div>
          <div className="lbl">Work packages</div>
          <div className="mt-2">
            <DataTable id="wp-packages-tbl" columns={packageColumns}>
              {sorted.map((p) => (
                <PackageStatusRow
                  key={p.id}
                  projectNumber={number}
                  pkg={{
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    selfPerform: p.selfPerform,
                    scopeLineCount: p.scopeLineItems.length,
                    budgetAmount: p.budgetAmount,
                    statusKind: p.statusKind,
                    invitations: p.invitations.map((i) => ({
                      id: i.id,
                      name: i.subcontractor.name,
                      sentAt: i.sentAt,
                      hasBid: i.bids.length > 0,
                    })),
                  }}
                />
              ))}
            </DataTable>
          </div>
        </div>
      </div>
    );
  }

  const pkg = project.bidPackages.find((p) => p.code === packageCode);
  if (!pkg) notFound();

  const invitedSubIds = new Set(pkg.invitations.map((i) => i.subcontractorId));
  const allSubs = await prisma.subcontractor.findMany({ orderBy: { name: "asc" } });
  const pkgDivisions = new Set(pkg.csiCodes.map(csiDivision));
  const availableSubs = allSubs
    .filter((s) => !invitedSubIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      trades: s.trades,
      csiMatch: s.csiCodes.some((c) => pkgDivisions.has(csiDivision(c))),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="tabs">
        <Link href={`/projects/${number}/work-packages`} style={{ padding: "7px 15px", font: "500 10.5px/1 var(--font-data)", letterSpacing: ".07em", textTransform: "uppercase", color: "var(--text-dim)", textDecoration: "none", borderRadius: "var(--r-pill)" }}>
          ← All packages
        </Link>
        {project.bidPackages.map((p) => (
          <a key={p.id} href={`?package=${p.code}`} className={p.id === pkg.id ? "on" : undefined}>
            {p.code} {p.name}
          </a>
        ))}
      </div>

      <div className="lbl">
        {pkg.code} {pkg.name}
      </div>

      <ItbHero
        projectNumber={number}
        packageCode={pkg.code}
        invitations={pkg.invitations.map((inv) => ({
          id: inv.id,
          subcontractorName: inv.subcontractor.name,
          trades: inv.subcontractor.trades,
          intent: inv.intent,
          sentAt: inv.sentAt,
          openedAt: inv.openedAt,
          hasBid: inv.bids.length > 0,
        }))}
      />

      <div>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Scope line items
        </div>
        <ScopeWorksheetTable projectNumber={number} packageId={pkg.id} lines={pkg.scopeLineItems} />
      </div>

      <AddBiddersModal projectNumber={number} bidPackageId={pkg.id} packageCode={pkg.code} availableSubs={availableSubs} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div className="mono flex items-center gap-2" style={{ fontSize: 18, fontWeight: 700 }}>
        {color && <span className="dot" style={{ background: color }} />}
        {value}
      </div>
    </div>
  );
}
