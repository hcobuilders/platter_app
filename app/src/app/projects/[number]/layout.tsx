import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { ProjectNav } from "@/components/ProjectNav";
import { CommandBar } from "@/components/CommandBar";
import { AccountMenu } from "@/components/AccountMenu";
import { getBuildVersion } from "@/lib/version";

async function getProject(number: string) {
  return prisma.project.findUnique({ where: { number } });
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const [project, session] = await Promise.all([getProject(number), auth()]);
  if (!project) notFound();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="topnav">
        <div className="left">
          <Link href="/" className="logo">
            <Logo />
          </Link>
          <Link href="/" className="crumb">
            / {project.name} /
          </Link>
        </div>
        <div className="center">
          <span className="pname">{project.name}</span>
          <span className="chip chip--info">{project.number}</span>
        </div>
        <div className="right">
          <nav>
            <span>Network</span>
            <span>Data</span>
            <span>Tools</span>
            <Link href="/settings" style={{ color: "inherit" }}>
              Settings
            </Link>
          </nav>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-invert-faint)" }} title="Build version">
            v{getBuildVersion()}
          </span>
          {session?.user && (
            <AccountMenu name={session.user.name ?? session.user.email ?? "Unknown"} role={session.user.role} buildVersion={getBuildVersion()} />
          )}
        </div>
      </div>
      <div className="wshell flex-1">
        <ProjectNav number={number} />
        <div className="wmain">{children}</div>
      </div>
      <CommandBar currentProjectNumber={number} />
    </div>
  );
}
