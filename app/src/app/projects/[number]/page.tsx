import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getProjectDetail(number: string) {
  return prisma.project.findUnique({
    where: { number },
    include: {
      dates: { orderBy: { at: "asc" } },
      bidPackages: {
        include: { scopeLineItems: true, invitations: { include: { subcontractor: true, bids: true } } },
      },
      budgetLines: true,
      projectFlags: { include: { flag: true } },
    },
  });
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const project = await getProjectDetail(number);
  if (!project) notFound();

  const totalBudget = project.budgetLines.reduce((sum, b) => sum + b.current, 0n);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <section>
        <div className="lbl">Project</div>
        <div className="cf mt-2">
          <Field label="Owner" value={project.owner} />
          <Field label="Architect of record" value={project.architectOfRecord} />
          <Field label="Delivery method" value={project.deliveryMethod} />
          <Field label="Status" value={project.status} />
          <Field label="Bond %" value={project.bondPct ? `${project.bondPct}%` : null} />
          <Field label="Retainage %" value={project.retainagePct ? `${project.retainagePct}%` : null} />
        </div>
        <div className="mt-3">
          <div className="lbl">Address</div>
          <div style={{ font: "var(--t-body)" }}>{project.address ?? "—"}</div>
        </div>
      </section>

      <section>
        <div className="lbl">Key dates</div>
        <div className="mt-2 flex flex-col gap-2">
          {project.dates.length === 0 && <p style={{ color: "var(--text-dim)" }}>None recorded.</p>}
          {project.dates.map((d) => (
            <div key={d.id} className="flex justify-between" style={{ fontSize: 13 }}>
              <span style={{ color: "var(--text-dim)" }}>{d.kind.replace(/_/g, " ")}</span>
              <span className="mono">{d.at.toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="lbl">Flags</div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {project.projectFlags.length === 0 && <span style={{ color: "var(--text-faint)" }}>None</span>}
          {project.projectFlags.map((pf) => (
            <span key={pf.id} className="chip chip--dgr">
              {pf.flag.label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="lbl">Bid packages</div>
        <table className="tbl mt-2">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Scope lines</th>
              <th>Invited subs</th>
              <th className="n">Budget</th>
            </tr>
          </thead>
          <tbody>
            {project.bidPackages.map((pkg) => (
              <tr key={pkg.id}>
                <td className="mono">{pkg.code}</td>
                <td>{pkg.name}</td>
                <td>{pkg.scopeLineItems.length}</td>
                <td>{pkg.invitations.length}</td>
                <td className="n mono">{formatCents(pkg.budgetAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <div className="lbl">Current budget total</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {formatCents(totalBudget)}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="lbl">{label}</div>
      <div style={{ font: "var(--t-body)", marginTop: 4 }}>{value ?? "—"}</div>
    </div>
  );
}
