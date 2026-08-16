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
      bidPackage: { include: { project: true } },
      bids: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });
}

export default async function ConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) notFound();

  const bid = invitation.bids[0];
  const { project } = invitation.bidPackage;

  if (!bid?.submittedAt) {
    return (
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="lbl">No quote on file yet</div>
        <p style={{ marginTop: 8, fontSize: 13.5, color: "var(--text-dim)" }}>
          You haven&apos;t submitted a quote for this package.
        </p>
        <Link href={`/planroom/${token}/quote`} className="btn btn--acc mt-3" style={{ display: "inline-flex" }}>
          Submit your quote
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 560 }}>
      <div className="card" style={{ borderLeft: "3px solid var(--success-line)" }}>
        <div className="lbl">Quote submitted</div>
        <div style={{ font: "700 clamp(24px,4vw,32px)/1.1 var(--font-display)", marginTop: 10 }}>
          {invitation.subcontractor.name}, you&apos;re all set.
        </div>
        <p style={{ marginTop: 10, fontSize: 13.5, color: "var(--text-dim)" }}>
          Your quote for <b style={{ color: "var(--text)" }}>{invitation.bidPackage.code} {invitation.bidPackage.name}</b> on{" "}
          <b style={{ color: "var(--text)" }}>{project.name}</b> was received{" "}
          {bid.submittedAt.toLocaleDateString()} at {bid.submittedAt.toLocaleTimeString()}.
        </p>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 14 }}>
          {formatCents(bid.total)}
        </div>
      </div>

      <div className="card">
        <div className="lbl" style={{ marginBottom: 10 }}>
          Questions about this package?
        </div>
        {project.gcContactName || project.gcContactEmail || project.gcContactPhone ? (
          <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>
            {project.gcContactName && <div style={{ fontWeight: 600 }}>{project.gcContactName}</div>}
            {project.gcContactEmail && (
              <div>
                <a href={`mailto:${project.gcContactEmail}`} style={{ color: "var(--info-text)" }}>
                  {project.gcContactEmail}
                </a>
              </div>
            )}
            {project.gcContactPhone && <div>{project.gcContactPhone}</div>}
          </div>
        ) : (
          <p style={{ fontSize: 13.5, color: "var(--text-dim)" }}>
            Contact information for this project hasn&apos;t been set up yet — reply to your invitation email.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Link href={`/planroom/${token}/quote`} className="btn btn--sm" style={{ display: "inline-flex" }}>
          Review / revise quote
        </Link>
        <Link href={`/planroom/${token}`} className="btn btn--sm btn--gh" style={{ display: "inline-flex" }}>
          Back to package overview
        </Link>
      </div>
    </div>
  );
}
