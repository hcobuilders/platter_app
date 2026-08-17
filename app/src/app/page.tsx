import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { CommandBar } from "@/components/CommandBar";
import { NewProjectModal } from "@/components/NewProjectModal";
import { DashboardBody, type CardProject } from "@/components/DashboardBody";
import { AccountMenu } from "@/components/AccountMenu";
import { getBuildVersion } from "@/lib/version";

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
      changeOrders: { select: { days: true, value: true } },
      commitments: { select: { id: true } },
    },
  });

  return projects.map((project) => {
    const itbOut = project.dates.find((d) => d.kind === "itb_out");
    const siteWalk = project.dates.find((d) => d.kind === "site_walk");
    const bidsDue = project.dates.find((d) => d.kind === "submission_due");
    const noticeToProceed = project.dates.find((d) => d.kind === "notice_to_proceed");
    const budgetTotal = project.budgetLines.reduce((sum, b) => sum + b.current, 0n);
    const quotedCount = project.bidPackages.filter((p) => p.invitations.some((i) => i.bids.length > 0)).length;
    const unresolvedCount = project.bidPackages.filter((p) => p._count.scopeLineItems === 0).length;
    const changeOrderDays = project.changeOrders.reduce((sum, co) => sum + co.days, 0);
    const changeOrderValue = project.changeOrders.reduce((sum, co) => sum + co.value, 0n);

    return {
      number: project.number,
      name: project.name,
      status: project.status,
      address: project.address,
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
      archivedAt: project.archivedAt?.toISOString() ?? null,
      contractDays: project.contractDays,
      noticeToProceedAt: noticeToProceed?.at.toISOString() ?? null,
      changeOrderDays,
      changeOrderValue: Number(changeOrderValue),
      commitmentCount: project.commitments.length,
    };
  });
}

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [projects, currentUser, projectTemplates] = await Promise.all([
    getProjects(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { dashboardStatusFilters: true } }),
    prisma.projectTemplate.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);

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
          <span className="mono" style={{ fontSize: 10, color: "var(--text-invert-faint)" }} title="Build version">
            v{getBuildVersion()}
          </span>
          <AccountMenu name={session.user.name ?? session.user.email ?? "Unknown"} role={session.user.role} buildVersion={getBuildVersion()} />
        </div>
      </div>

      <div className="appbody flex-1" style={{ padding: "22px clamp(16px,3vw,32px)" }}>
        <DashboardBody projects={projects} initialStatusFilters={currentUser?.dashboardStatusFilters ?? []} />
      </div>

      <CommandBar />
      <Suspense fallback={null}>
        <NewProjectModal templates={projectTemplates} />
      </Suspense>
    </div>
  );
}
