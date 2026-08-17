import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/format";
import { updateBudgetLine, saveBudgetRevision, rollbackToRevision } from "./actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { UndoListener } from "@/components/UndoListener";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { ResizableColumns } from "@/components/ResizableColumns";

export const dynamic = "force-dynamic";

async function getProject(number: string) {
  return prisma.project.findUnique({
    where: { number },
    include: {
      budgetLines: {
        orderBy: [{ csiCode: "asc" }, { description: "asc" }],
        include: {
          bidPackage: {
            include: {
              invitations: {
                include: {
                  subcontractor: true,
                  bids: { orderBy: { submittedAt: "desc" }, take: 1 },
                },
              },
            },
          },
        },
      },
      budgetRevisions: { orderBy: { revNo: "desc" } },
    },
  });
}

// CSI 2026 (current) division -> legacy 16-division MasterFormat, for the
// display toggle (D-11: storage stays CSI 2026, 16-div is a transform only).
// Only the divisions this seed data actually uses are mapped.
const DIVISION_48: Record<string, string> = {
  "02": "Existing Conditions & Demolition",
  "03": "Concrete",
  "05": "Metals",
  "06": "Wood, Plastics & Composites",
  "07": "Thermal & Moisture Protection",
  "08": "Openings",
  "09": "Finishes",
  "22": "Plumbing",
  "23": "HVAC",
  "26": "Electrical",
};
const DIVISION_16: Record<string, { code: string; name: string }> = {
  "02": { code: "02", name: "Site Work" },
  "03": { code: "03", name: "Concrete" },
  "05": { code: "05", name: "Metals" },
  "06": { code: "06", name: "Wood & Plastics" },
  "07": { code: "07", name: "Moisture Protection" },
  "08": { code: "08", name: "Doors & Windows" },
  "09": { code: "09", name: "Finishes" },
  "22": { code: "15", name: "Mechanical" },
  "23": { code: "15", name: "Mechanical" },
  "26": { code: "16", name: "Electrical" },
};

export default async function BudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ view?: string; revA?: string; revB?: string; divView?: string }>;
}) {
  const { number } = await params;
  const sp = await searchParams;
  const project = await getProject(number);
  if (!project) notFound();

  const view = sp.view ?? "table";
  const divView = sp.divView === "16" ? "16" : "48";

  const total = project.budgetLines.reduce((s, b) => s + b.budget, 0n);
  const currentTotal = project.budgetLines.reduce((s, b) => s + b.current, 0n);
  const buyoutTotal = project.budgetLines.reduce((s, b) => s + (b.buyoutExpected ?? 0n), 0n);

  // Group lines under their division — CSI 2026 (raw csiCode) or the
  // legacy-16 transform, per the toggle.
  type Group = { code: string; name: string; lines: typeof project.budgetLines };
  const groups = new Map<string, Group>();
  for (const line of project.budgetLines) {
    const raw = line.csiCode ?? "00";
    const key = divView === "16" ? (DIVISION_16[raw]?.code ?? raw) : raw;
    const name = divView === "16" ? (DIVISION_16[raw]?.name ?? "Other") : (DIVISION_48[raw] ?? "Other");
    if (!groups.has(key)) groups.set(key, { code: key, name, lines: [] });
    groups.get(key)!.lines.push(line);
  }
  const sortedGroups = Array.from(groups.values()).sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="flex flex-col gap-6">
      <UndoListener />
      <div className="flex justify-between items-center">
        <div className="tabs">
          <a href={`?view=table&divView=${divView}`} className={view === "table" ? "on" : undefined}>
            Main view
          </a>
          <a href="?view=revisions" className={view === "revisions" ? "on" : undefined}>
            Revisions
          </a>
        </div>
        {view === "table" && (
          <div className="tabs">
            <a href="?view=table&divView=48" className={divView === "48" ? "on" : undefined}>
              CSI 2026
            </a>
            <a href="?view=table&divView=16" className={divView === "16" ? "on" : undefined}>
              16-division
            </a>
          </div>
        )}
      </div>

      {view === "table" && (
        <div>
          <ResizableColumns tableId="budget-tbl" />
          <div className="bwrap">
          <table className="tbl" id="budget-tbl">
            <thead>
              <tr>
                <th>CSI</th>
                <th>Package</th>
                <th className="n">Budget</th>
                <th className="n">Current</th>
                <th className="n">Buyout exp.</th>
                <th>Awarded to</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => {
                const groupBudget = group.lines.reduce((s, b) => s + b.budget, 0n);
                const groupCurrent = group.lines.reduce((s, b) => s + b.current, 0n);
                const groupBuyout = group.lines.reduce((s, b) => s + (b.buyoutExpected ?? 0n), 0n);
                return (
                  <Fragment key={group.code}>
                    <tr style={{ background: "var(--bg-inset)" }}>
                      <td className="mono" style={{ fontWeight: 700 }}>
                        {group.code}
                      </td>
                      <td style={{ fontWeight: 700 }}>{group.name}</td>
                      <td className="n mono" style={{ fontWeight: 700 }}>
                        {formatCents(groupBudget)}
                      </td>
                      <td className="n mono" style={{ fontWeight: 700 }}>
                        {formatCents(groupCurrent)}
                      </td>
                      <td className="n mono" style={{ fontWeight: 700 }}>
                        {formatCents(groupBuyout)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    {group.lines.map((line) => {
              const formId = `bl-${line.id}`;
              const verified = Boolean(line.awardedTo);
              const leveledSubs = (line.bidPackage?.invitations ?? [])
                .filter((inv) => inv.bids[0]?.submittedAt)
                .map((inv) => inv.subcontractor.name);
              const awardedToOptions = [
                { value: "", label: leveledSubs.length ? "— select —" : "— no leveled bids yet —" },
                ...leveledSubs.map((n) => ({ value: n, label: n })),
                // Keep whatever's already on record even if it's not a leveled sub
                // (manually entered before this became a dropdown), so switching
                // to a dropdown never silently drops existing data.
                ...(line.awardedTo && !leveledSubs.includes(line.awardedTo) ? [{ value: line.awardedTo, label: `${line.awardedTo} (not in bid tab)` }] : []),
              ];
              return (
                <tr key={line.id}>
                  <td className="mono" style={{ paddingLeft: 28, color: "var(--text-faint)" }}>
                    {line.bidPackage?.code ?? ""}
                  </td>
                  <td style={{ paddingLeft: 28 }}>
                    {line.bidPackage ? (
                      <>
                        <Link
                          href={`/projects/${number}/bid-tab?package=${encodeURIComponent(line.bidPackage.code)}`}
                          className="chip"
                          style={{ marginRight: 8 }}
                          title="Open this package's bid tab"
                        >
                          {line.bidPackage.code}
                        </Link>
                        {line.bidPackage.name}
                      </>
                    ) : (
                      line.description
                    )}
                  </td>
                    <td className="n">
                      <CurrencyInput
                        form={formId}
                        className="tfld n"
                        name="budget"
                        defaultValue={Number(line.budget) / 100}
                        autoSubmit
                      />
                    </td>
                    <td className="n">
                      <CurrencyInput
                        form={formId}
                        className="tfld n"
                        name="current"
                        defaultValue={Number(line.current) / 100}
                        style={{ color: verified ? "var(--success-text)" : "var(--info-text)" }}
                        autoSubmit
                      />
                    </td>
                    <td className="n">
                      <CurrencyInput
                        form={formId}
                        className="tfld n"
                        name="buyoutExpected"
                        defaultValue={line.buyoutExpected ? Number(line.buyoutExpected) / 100 : ""}
                        autoSubmit
                      />
                    </td>
                    <td>
                      <AutoSubmitSelect form={formId} className="tfld" name="awardedTo" defaultValue={line.awardedTo ?? ""} options={awardedToOptions} />
                    </td>
                    <td>
                      {line.tags.map((t) => (
                        <span key={t} className="chip" style={{ marginRight: 4 }}>
                          {t}
                        </span>
                      ))}
                    </td>
                  </tr>
                );
                    })}
                  </Fragment>
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
              </tr>
            </tfoot>
          </table>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
            Changes are saved automatically — press Ctrl/Cmd+Z to undo the last edit. Current-value
            color follows E-02/E-39&apos;s rule — sea green once a real award is on record (Awarded to
            is set), cerulean while it&apos;s still an estimate.
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
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
          {revisions.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3" style={{ lineHeight: 2.1 }}>
              <span>
                Rev {r.revNo} — {r.note ?? "no note"} · {r.createdAt.toLocaleDateString()}
              </span>
              {i !== 0 && (
                <form
                  action={async () => {
                    "use server";
                    await rollbackToRevision(project.id, projectNumber, r.revNo);
                  }}
                >
                  <ConfirmSubmitButton
                    className="btn btn--sm btn--gh"
                    confirmMessage={`Roll back live budget "current" values to Rev ${r.revNo}? This saves a new revision first so today's numbers aren't lost.`}
                  >
                    Roll back to this revision
                  </ConfirmSubmitButton>
                </form>
              )}
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
