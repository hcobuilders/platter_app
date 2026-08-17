import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { createScopeLine, updateScopeLine, deleteScopeLine } from "./actions";
import { KindPicker } from "@/components/KindPicker";
import { CsiCodeInput } from "@/components/CsiCodeInput";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { Checkbox } from "@/components/Checkbox";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getPackages(number: string) {
  const project = await prisma.project.findUnique({
    where: { number },
    include: {
      bidPackages: {
        include: {
          scopeLineItems: { orderBy: { seq: "asc" } },
          invitations: { select: { id: true } },
        },
      },
    },
  });
  return project;
}

export default async function ScopePage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { number } = await params;
  const { package: packageCode } = await searchParams;
  const project = await getPackages(number);
  if (!project) notFound();

  if (project.bidPackages.length === 0) {
    return <p style={{ color: "var(--text-dim)" }}>No bid packages yet.</p>;
  }

  // Default landing view: a table of every package with stats. Drilling
  // into one (via ?package=) opens the tabs-on-top, full-screen editor below.
  if (!packageCode) {
    const packageColumns: DataTableColumn[] = [
      { id: "code", label: "Code", width: 110 },
      { id: "name", label: "Name", width: 260 },
      { id: "lines", label: "Scope lines", width: 110, align: "right" },
      { id: "subs", label: "Invited subs", width: 110, align: "right" },
      { id: "budget", label: "Budget", width: 130, align: "right" },
    ];
    return (
      <div>
        <div className="lbl">Bid packages</div>
        <div className="mt-2">
          <DataTable id="scope-packages-tbl" columns={packageColumns}>
            {project.bidPackages.map((p) => (
              <tr key={p.id}>
                <td className="mono">
                  <Link href={`?package=${p.code}`} style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>
                    {p.code}
                  </Link>
                </td>
                <td>
                  <Link href={`?package=${p.code}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {p.name}
                  </Link>
                </td>
                <td className="n">{p.scopeLineItems.length}</td>
                <td className="n">{p.invitations.length}</td>
                <td className="n">{formatCents(p.budgetAmount)}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    );
  }

  const pkg = project.bidPackages.find((p) => p.code === packageCode);
  if (!pkg) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="tabs">
        <Link href={`/projects/${number}/scope`} style={{ padding: "7px 15px", font: "500 10.5px/1 var(--font-data)", letterSpacing: ".07em", textTransform: "uppercase", color: "var(--text-dim)", textDecoration: "none", borderRadius: "var(--r-pill)" }}>
          ← All packages
        </Link>
        {project.bidPackages.map((p) => (
          <a key={p.id} href={`?package=${p.code}`} className={p.id === pkg.id ? "on" : undefined}>
            {p.code} {p.name}
          </a>
        ))}
      </div>

      {(() => {
        const worksheetColumns: DataTableColumn[] = [
          { id: "seq", label: "#", width: 44, minWidth: 36 },
          { id: "csi", label: "CSI", width: 110 },
          { id: "description", label: "Description", width: 260 },
          { id: "unit", label: "Unit", width: 80 },
          { id: "qty", label: "Qty", width: 90, align: "right" },
          { id: "kind", label: "Kind", width: 110 },
          { id: "required", label: "Required", width: 90, align: "center" },
          { id: "submittal", label: "Submittal", width: 90, align: "center" },
          { id: "longlead", label: "Long lead (wks)", width: 120, align: "right" },
          { id: "actions", label: "", width: 130, resizable: false },
        ];
        const addFormId = "add-scope-line-form";
        return (
          <div>
            <div className="lbl">
              Scope worksheet — {pkg.code} {pkg.name}
            </div>
            <div className="mt-2">
              <DataTable
                id="scope-tbl"
                columns={worksheetColumns}
                footer={
                  <tr>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>
                      +
                    </td>
                    <td>
                      <CsiCodeInput form={addFormId} className="tfld mono" name="csiCode" />
                    </td>
                    <td>
                      <input form={addFormId} className="tfld" name="description" placeholder="Description" required />
                    </td>
                    <td>
                      <input form={addFormId} className="tfld" name="unit" placeholder="Unit" />
                    </td>
                    <td className="n">
                      <input form={addFormId} className="tfld n" name="qty" type="number" step="any" />
                    </td>
                    <td>
                      <KindPicker form={addFormId} name="kind" defaultValue="inclusion" compact />
                    </td>
                    <td className="ctr">
                      <Checkbox form={addFormId} name="isRequired" defaultChecked aria-label="Required" />
                    </td>
                    <td className="ctr">
                      <Checkbox form={addFormId} name="submittalRequired" aria-label="Submittal required" />
                    </td>
                    <td className="n">
                      <input form={addFormId} className="tfld n" name="longLeadWeeks" type="number" style={{ width: 60 }} />
                    </td>
                    <td>
                      <button form={addFormId} className="btn btn--sm btn--acc" type="submit">
                        + Add line
                      </button>
                    </td>
                  </tr>
                }
              >
                {pkg.scopeLineItems.map((line) => {
                  const formId = `row-${line.id}`;
                  return (
                    <tr key={line.id}>
                      <td className="mono">{line.seq}</td>
                      <td>
                        <CsiCodeInput form={formId} className="tfld mono" name="csiCode" defaultValue={line.csiCode ?? ""} />
                      </td>
                      <td className="wrap">
                        <input form={formId} className="tfld" name="description" defaultValue={line.description} />
                      </td>
                      <td>
                        <input form={formId} className="tfld" name="unit" defaultValue={line.unit ?? ""} />
                      </td>
                      <td className="n">
                        <input form={formId} className="tfld n" name="qty" type="number" step="any" defaultValue={line.qty ?? ""} />
                      </td>
                      <td>
                        <KindPicker form={formId} name="kind" defaultValue={line.kind} compact />
                      </td>
                      <td className="ctr">
                        <Checkbox form={formId} name="isRequired" defaultChecked={line.isRequired} aria-label="Required" />
                      </td>
                      <td className="ctr">
                        <Checkbox form={formId} name="submittalRequired" defaultChecked={line.submittalRequired} aria-label="Submittal required" />
                      </td>
                      <td className="n">
                        <input form={formId} className="tfld n" name="longLeadWeeks" type="number" defaultValue={line.longLeadWeeks ?? ""} />
                      </td>
                      <td className="wrap" style={{ display: "flex", gap: 6 }}>
                        <button form={formId} className="btn btn--sm" type="submit">
                          Save
                        </button>
                        <form
                          action={async () => {
                            "use server";
                            await deleteScopeLine(number, line.id);
                          }}
                        >
                          <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            </div>
            {/* Row-scoped forms live outside the table entirely — <tr> may only contain <td>/<th>.
                Every input/select/button above associates to its row's form via the form="" attribute. */}
            {pkg.scopeLineItems.map((line) => (
              <form
                key={line.id}
                id={`row-${line.id}`}
                action={async (fd) => {
                  "use server";
                  await updateScopeLine(number, line.id, fd);
                }}
                style={{ display: "none" }}
              />
            ))}
            <form
              id={addFormId}
              action={async (fd) => {
                "use server";
                await createScopeLine(number, pkg.id, fd);
              }}
              style={{ display: "none" }}
            />
          </div>
        );
      })()}
    </div>
  );
}
