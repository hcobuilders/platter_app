import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { CommandBar } from "@/components/CommandBar";
import { NewProjectModal } from "@/components/NewProjectModal";
import { DashboardBody, type CardProject } from "@/components/DashboardBody";

export const dynamic = "force-dynamic";

async function getProjects(): Promise<CardProject[]> {
  const projects = await prisma.project.findMany({
    orderBy: { number: "asc" },
    include: {
      dates: true,
      budgetLines: { select: { current: true } },
      bidPackages: {
        select: {
          id: true,
          _count: { select: { scopeLineItems: true } },
          invitations: { select: { bids: { select: { id: true }, take: 1 } } },
        },
      },
    },
  });

  return projects.map((project) => {
    const itbOut = project.dates.find((d) => d.kind === "itb_out");
    const siteWalk = project.dates.find((d) => d.kind === "site_walk");
    const bidsDue = project.dates.find((d) => d.kind === "submission_due");
    const budgetTotal = project.budgetLines.reduce((sum, b) => sum + b.current, 0n);
    const quotedCount = project.bidPackages.filter((p) => p.invitations.some((i) => i.bids.length > 0)).length;
    const unresolvedCount = project.bidPackages.filter((p) => p._count.scopeLineItems === 0).length;

    return {
      number: project.number,
      name: project.name,
      status: project.status,
      address: project.address,
      bondPct: project.bondPct,
      packageCount: project.bidPackages.length,
      quotedCount,
      unresolvedCount,
      budgetTotal: Number(budgetTotal),
      budgetVerified: project.budgetLines.length > 0,
      itbOut: itbOut?.at.toISOString() ?? null,
      siteWalk: siteWalk?.at.toISOString() ?? null,
      siteWalkMandatory: siteWalk?.isMandatory ?? false,
      bidsDue: bidsDue?.at.toISOString() ?? null,
      awardTarget: null,
    };
  });
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="topnav">
        <div className="left">
          <Link href="/?new=1" className="qa">
            ＋ New project
          </Link>
        </div>
        <div className="center">
          <div className="logo">
            <Logo size={19} />
          </div>
          <nav>
            <span className="on" style={{ color: "var(--accent-fill)" }}>
              Files
            </span>
            <span>Network</span>
            <span>Data</span>
            <span>Tools</span>
            <Link href="/settings" style={{ color: "inherit", textDecoration: "none" }}>
              Settings
            </Link>
          </nav>
        </div>
        <div className="right">
          <span className="search">Search projects…</span>
          <div className="avatar">JL</div>
        </div>
      </div>

      <div className="appbody flex-1" style={{ padding: "22px clamp(16px,3vw,32px)" }}>
        <DashboardBody projects={projects} />
      </div>

      <CommandBar />
      <Suspense fallback={null}>
        <NewProjectModal />
      </Suspense>
    </div>
  );
}
