import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";

async function getInvitation(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      subcontractor: true,
      bidPackage: { include: { project: true } },
    },
  });
}

export default async function PlanroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) notFound();

  return (
    <div style={{ background: "var(--bg-surface-paper)", color: "var(--text)", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 28px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span style={{ font: "600 15px var(--font-display)" }}>Platter Planroom</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
          {invitation.subcontractor.name} · magic link, no account needed
        </div>
      </header>
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px" }}>{children}</main>
    </div>
  );
}
