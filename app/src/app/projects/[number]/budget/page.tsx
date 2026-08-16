import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/format";
import { updateBudgetLine, saveBudgetRevision } from "./actions";

export const dynamic = "force-dynamic";

async function getProject(number: string) {
  return prisma.project.findUnique({
    where: { number },
    include: {
      budgetLines: { orderBy: { csiCode: "asc" } },
      budgetRevisions: { orderBy: { revNo: "desc" } },
    },
  });
}

export default async function BudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ view?: string; revA?: string; revB?: string }>;
}) {
  const { number } = await params;
  const sp = await searchParams;
  const project = await getProject(number);
  if (!project) notFound();

  const view = sp.view ?? "table";

  const total = project.budgetLines.reduce((s, b) => s + b.budget, 0n);
  const currentTotal = project.budgetLines.reduce((s, b) => s + b.current, 0n);
  const buyoutTotal = project.budgetLines.reduce((s, b) => s + (b.buyoutExpected ?? 0n), 0n);

  return (
    <div className="flex flex-col gap-6">
      <div className="tabs">
        <a href="?view=table" className={view === "table" ? "on" : undefined}>
          Main view
        </a>
        <a href="?view=revisions" className={view === "revisions" ? "on" : undefined}>
          Revisions
        </a>
      </div>

      {view === "table" && (
        <div>
          <table className="tbl">
            <thead>
              <tr>
                <th>CSI</th>
                <th>Package</th>
                <th className="n">Budget</th>
                <th className="n">Current</th>
                <th className="n">Buyout exp.</th>
                <th>Awarded to</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.budgetLines.map((line) => {
                const formId = `bl-${line.id}`;
                const verified = Boolean(line.awardedTo);
                return (
                  <tr key={line.id}>
                    <td className="mono">{line.csiCode}</td>
                    <td>{line.description}</td>
                    <td className="n">
                      <input
                        form={formId}
                        className="fld"
                        name="budget"
                        type="number"
                        step="0.01"
                        defaultValue={Number(line.budget) / 100}
                        style={{ width: 110, textAlign: "right" }}
                      />
                    </td>
                    <td className="n">
                      <input
                        form={formId}
                        className="fld"
                        name="current"
                        type="number"
                        step="0.01"
                        defaultValue={Number(line.current) / 100}
                        style={{
                          width: 110,
                          textAlign: "right",
                          color: verified ? "var(--success-text)" : "var(--info-text)",
                        }}
                      />
                    </td>
                    <td className="n">
                      <input
                        form={formId}
                        className="fld"
                        name="buyoutExpected"
                        type="number"
                        step="0.01"
                        defaultValue={line.buyoutExpected ? Number(line.buyoutExpected) / 100 : ""}
                        style={{ width: 110, textAlign: "right" }}
                      />
                    </td>
                    <td>
                      <input form={formId} className="fld" name="awardedTo" defaultValue={line.awardedTo ?? ""} style={{ width: 140 }} />
                    </td>
                    <td>
                      {line.tags.map((t) => (
                        <span key={t} className="chip" style={{ marginRight: 4 }}>
                          {t}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button form={formId} className="btn btn--sm" type="submit">
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: "right", font: "600 12.5px var(--font-body)", padding: "11px 12px" }}>
                  Total
                </td>
                <td className="n mono" style={{ fontWeight: 700 }}>
                  {formatCents(total)}
                </td>
                <td className="n mono" style={{ fontWeight: 700 }}>
                  {formatCents(currentTotal)}
                </td>
                <td className="n mono" style={{ fontWeight: 700 }}>
                  {formatCents(buyoutTotal)}
                </td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
            Current-value color follows E-02/E-39&apos;s rule — sea green once a real award is on
            record (Awarded to is set), cerulean while it&apos;s still an estimate.
          </p>

          {project.budgetLines.map((line) => (
            <form
              key={line.id}
              id={`bl-${line.id}`}
              action={async (fd) => {
                "use server";
                await updateBudgetLine(number, line.id, fd);
              }}
              style={{ display: "none" }}
            />
          ))}
        </div>
      )}

      {view === "revisions" && (
        <RevisionsView project={project} projectNumber={number} revA={sp.revA} revB={sp.revB} />
      )}
    </div>
  );
}

function RevisionsView({
  project,
  projectNumber,
  revA,
  revB,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getProject>>>;
  projectNumber: string;
  revA?: string;
  revB?: string;
}) {
  const revisions = project.budgetRevisions;
  const revANo = revA ? Number(revA) : revisions[1]?.revNo ?? revisions[0]?.revNo;
  const revBNo = revB ? Number(revB) : revisions[0]?.revNo;
  const a = revisions.find((r) => r.revNo === revANo);
  const b = revisions.find((r) => r.revNo === revBNo);

  const snapA = (a?.snapshot as Record<string, number>) ?? {};
  const snapB = (b?.snapshot as Record<string, number>) ?? {};
  const allKeys = Array.from(new Set([...Object.keys(snapA), ...Object.keys(snapB)]));

  return (
    <div className="flex flex-col gap-6">
      <div className="card" style={{ maxWidth: 460 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Save current state as a revision
        </div>
        <form
          action={async (fd) => {
            "use server";
            await saveBudgetRevision(project.id, projectNumber, fd);
          }}
          className="flex flex-col gap-3"
        >
          <input className="fld" name="note" placeholder="Optional note…" />
          <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
            Save Rev {(revisions[0]?.revNo ?? -1) + 1}
          </button>
        </form>
      </div>

      <div>
        <div className="lbl" style={{ marginBottom: 8 }}>
          History
        </div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 2.1 }}>
          {revisions.map((r) => (
            <div key={r.id}>
              Rev {r.revNo} — {r.note ?? "no note"} · {r.createdAt.toLocaleDateString()}
            </div>
          ))}
          {revisions.length === 0 && <div>No revisions saved yet.</div>}
        </div>
      </div>

      {revisions.length >= 2 && a && b && (
        <div>
          <form method="get" className="flex gap-2 items-center mb-3">
            <input type="hidden" name="view" value="revisions" />
            <select className="fld" style={{ width: "auto" }} defaultValue={a.revNo} name="revA">
              {revisions.map((r) => (
                <option key={r.revNo} value={r.revNo}>
                  Rev {r.revNo}
                </option>
              ))}
            </select>
            <span style={{ color: "var(--text-faint)" }}>→</span>
            <select className="fld" style={{ width: "auto" }} defaultValue={b.revNo} name="revB">
              {revisions.map((r) => (
                <option key={r.revNo} value={r.revNo}>
                  Rev {r.revNo}
                </option>
              ))}
            </select>
            <button className="btn btn--sm" type="submit">
              Compare
            </button>
          </form>

          <table className="tbl">
            <thead>
              <tr>
                <th>Package</th>
                <th className="n">Rev {a.revNo}</th>
                <th className="n">Rev {b.revNo}</th>
                <th className="n">Δ</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map((key) => {
                const va = snapA[key];
                const vb = snapB[key];
                const delta = va !== undefined && vb !== undefined ? vb - va : null;
                return (
                  <tr key={key}>
                    <td>{key}</td>
                    <td className="n mono">{va !== undefined ? formatCents(va) : "—"}</td>
                    <td className="n mono">{vb !== undefined ? formatCents(vb) : "—"}</td>
                    <td className="n">
                      {delta === null || delta === 0 ? (
                        <span style={{ color: "var(--text-faint)" }}>—</span>
                      ) : (
                        <span className={`delta ${delta > 0 ? "up" : "down"}`}>
                          {delta > 0 ? "+" : ""}
                          {formatCents(delta)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
