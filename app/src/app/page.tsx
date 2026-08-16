import { prisma } from "@/lib/db";

async function getProject() {
  try {
    return await prisma.project.findUnique({ where: { number: "26-085" } });
  } catch {
    return null;
  }
}

export default async function Home() {
  const project = await getProject();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <svg viewBox="0 0 64 64" width="40" height="40">
        <defs>
          <linearGradient id="lg" x1="37" y1="9" x2="55" y2="27" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF9F1C" />
            <stop offset="1" stopColor="#FE6D73" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#FEF9EF" strokeWidth={3.4} strokeLinejoin="round">
          <rect x={9} y={17} width={18} height={18} rx={4.5} />
          <rect x={9} y={37} width={18} height={18} rx={4.5} />
          <rect x={29} y={37} width={18} height={18} rx={4.5} />
          <rect x={37} y={9} width={18} height={18} rx={4.5} fill="url(#lg)" />
        </g>
      </svg>

      <div className="text-center" style={{ font: "var(--t-h1)" }}>
        Platter
      </div>
      <p
        className="max-w-md text-center"
        style={{ font: "var(--t-body)", color: "var(--text-invert-dim)" }}
      >
        Step 3 scaffold is live — Next.js + Prisma on Postgres, phase-1
        vertical slice (Project → Scope → ITB → Planroom → Bid Tab → Budget).
      </p>

      <div
        className="w-full max-w-md rounded-[var(--r-lg)] p-6"
        style={{
          background: "var(--bg-shell-raised)",
          border: "1px solid var(--border-invert)",
        }}
      >
        <div style={{ font: "var(--t-label)", color: "var(--accent-fill)", letterSpacing: "var(--track-label)", textTransform: "uppercase" }}>
          Database
        </div>
        {project ? (
          <>
            <div className="mt-2" style={{ font: "var(--t-h3)" }}>
              {project.name}
            </div>
            <div style={{ font: "var(--t-data)", color: "var(--text-invert-dim)" }}>
              {project.number} · seeded and connected
            </div>
          </>
        ) : (
          <div className="mt-2" style={{ font: "var(--t-body-sm)", color: "var(--text-invert-dim)" }}>
            Not connected yet — apply the Railway Postgres deploy, set{" "}
            <code>DATABASE_URL</code>, then run{" "}
            <code>npm run db:migrate &amp;&amp; npm run db:seed</code>.
          </div>
        )}
      </div>
    </main>
  );
}
