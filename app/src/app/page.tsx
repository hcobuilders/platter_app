import Link from "next/link";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getProjects() {
  return prisma.project.findMany({
    orderBy: { number: "asc" },
    include: {
      budgetLines: { select: { current: true } },
    },
  });
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3 mb-10">
        <Logo size={32} />
        <span style={{ font: "var(--t-h1)" }}>Platter</span>
      </div>

      <div style={{ font: "var(--t-label)", color: "var(--accent-fill)", letterSpacing: "var(--track-label)", textTransform: "uppercase" }}>
        Projects
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {projects.length === 0 && (
          <p style={{ color: "var(--text-invert-dim)" }}>No projects yet.</p>
        )}
        {projects.map((project) => {
          const total = project.budgetLines.reduce((sum, b) => sum + b.current, 0n);
          return (
            <Link
              key={project.id}
              href={`/projects/${project.number}`}
              className="card"
              style={{
                background: "var(--bg-shell-raised)",
                border: "1px solid var(--border-invert)",
                color: "var(--text-invert)",
                textDecoration: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div style={{ font: "var(--t-h3)" }}>{project.name}</div>
                <div style={{ font: "var(--t-data)", color: "var(--text-invert-dim)", marginTop: 4 }}>
                  {project.number} · {project.status}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 18, color: "var(--text-invert)", flex: "0 0 auto", marginLeft: 16, whiteSpace: "nowrap" }}>
                {formatCents(total)}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
