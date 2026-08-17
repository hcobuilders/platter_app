import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getInvitation(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      subcontractor: true,
      bidPackage: {
        include: {
          project: true,
          scopeLineItems: { orderBy: { seq: "asc" } },
        },
      },
      bids: { include: { bidLines: true }, orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });
}

const KIND_LABEL: Record<string, string> = {
  inclusion: "Inclusion",
  exclusion: "Exclusion",
  alternate: "Alternate",
  allowance: "Allowance",
  unit_price: "Unit price",
  clarification: "Clarification",
  va_option: "VA option",
};

export default async function PlanroomLanding({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) notFound();

  if (!invitation.openedAt) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { openedAt: new Date() } });
  }

  const { bidPackage } = invitation;
  const submittedBid = invitation.bids[0];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="lbl">You&apos;re invited to bid</div>
        <div style={{ font: "700 clamp(28px,4vw,38px)/1.1 var(--font-display)", marginTop: 8 }}>
          {bidPackage.project.name}
        </div>
        <div style={{ font: "var(--t-data)", color: "var(--text-dim)", marginTop: 6 }}>
          {bidPackage.project.number} · {bidPackage.code} {bidPackage.name}
        </div>
      </div>

      {invitation.intent === "no_bid" ? (
        <div className="card">You&apos;ve declined to bid on this package.</div>
      ) : submittedBid ? (
        <div className="card" style={{ borderLeft: "2px solid var(--success-line)" }}>
          <div className="lbl">Quote submitted</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
            {formatCents(submittedBid.total)}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 4 }}>
            Submitted {submittedBid.submittedAt?.toLocaleDateString()}
          </div>
          <Link href={`/planroom/${token}/quote`} className="btn btn--sm mt-3" style={{ display: "inline-flex" }}>
            Review / revise quote
          </Link>
        </div>
      ) : (
        <Link href={`/planroom/${token}/quote`} className="btn btn--acc" style={{ width: "fit-content" }}>
          Submit your quote
        </Link>
      )}

      <div>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Scope
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Description</th>
              <th>Kind</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {bidPackage.scopeLineItems.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td>{KIND_LABEL[line.kind]}</td>
                <td>{line.unit ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
