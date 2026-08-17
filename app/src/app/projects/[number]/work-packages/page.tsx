import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { formatCents } from "@/lib/format";
import { ItbHero } from "./ItbHero";
import { AddBiddersModal } from "./AddBiddersModal";
import { ScopeWorksheetTable } from "./ScopeWorksheetTable";

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
        },
      },
    },
  });
  return project;
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
  searchParams: Promise<{ package?: string; addBidders?: string }>;
}) {
  const { number } = await params;
  const { package: packageCode } = await searchParams;
  const project = await getPackages(number);
  if (!project) notFound();

  if (project.bidPackages.length === 0) {
    return <p style={{ color: "var(--text-dim)" }}>No bid packages yet.</p>;
  }

  // Default landing view: a table of every package with stats. Drilling
  // into one (via ?package=) opens the tabs-on-top, full-screen editor below.
  if (!packageCode) {
    const packageColumns: DataTableColumn[] = [
      { id: "code", label: "Code", width: 110 },
      { id: "name", label: "Name", width: 260 },
      { id: "lines", label: "Scope lines", width: 110, align: "right" },
      { id: "subs", label: "Invited subs", width: 110, align: "right" },
      { id: "budget", label: "Budget", width: 130, align: "right" },
    ];
    return (
      <div>
        <div className="lbl">Work packages</div>
        <div className="mt-2">
          <DataTable id="wp-packages-tbl" columns={packageColumns}>
            {project.bidPackages.map((p) => (
              <tr key={p.id}>
                <td className="mono">
                  <Link href={`?package=${p.code}`} style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>
                    {p.code}
                  </Link>
                </td>
                <td>
                  <Link href={`?package=${p.code}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {p.name}
                  </Link>
                </td>
                <td className="n">{p.scopeLineItems.length}</td>
                <td className="n">{p.invitations.length}</td>
                <td className="n">{formatCents(p.budgetAmount)}</td>
              </tr>
            ))}
          </DataTable>
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
