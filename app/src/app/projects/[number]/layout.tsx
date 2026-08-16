import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { ProjectNav } from "@/components/ProjectNav";

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
  const project = await getProject(number);
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
            <span>Settings</span>
          </nav>
          <div className="avatar">JL</div>
        </div>
      </div>
      <div className="wshell flex-1">
        <ProjectNav number={number} />
        <div className="wmain">{children}</div>
      </div>
      <div className="cmd">
        <span style={{ color: "var(--accent-fill)", fontWeight: 700 }}>/</span> Type a command or a
        project number
      </div>
    </div>
  );
}
