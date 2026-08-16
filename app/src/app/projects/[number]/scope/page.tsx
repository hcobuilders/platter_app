import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { createScopeLine, updateScopeLine, deleteScopeLine } from "./actions";
import { KindPicker } from "@/components/KindPicker";
import { CsiCodeInput } from "@/components/CsiCodeInput";
import { ResizableColumns } from "@/components/ResizableColumns";
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
    return (
      <div>
        <div className="lbl">Bid packages</div>
        <div className="bwrap mt-2">
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th className="n">Scope lines</th>
                <th className="n">Invited subs</th>
                <th className="n">Budget</th>
              </tr>
            </thead>
            <tbody>
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
            </tbody>
          </table>
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

      <div>
        <div className="lbl">
          Scope worksheet — {pkg.code} {pkg.name}
        </div>
        <ResizableColumns tableId="scope-tbl" />
        <div className="bwrap mt-2">
        <table className="tbl" id="scope-tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>CSI</th>
              <th>Description</th>
              <th>Unit</th>
              <th className="n">Qty</th>
              <th>Kind</th>
              <th>Required</th>
              <th>Submittal</th>
              <th>Long lead (wks)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pkg.scopeLineItems.map((line) => {
              const formId = `row-${line.id}`;
              return (
                <tr key={line.id}>
                  <td className="mono">{line.seq}</td>
                  <td>
                    <CsiCodeInput form={formId} className="tfld mono" name="csiCode" defaultValue={line.csiCode ?? ""} style={{ width: 90 }} />
                  </td>
                  <td>
                    <input form={formId} className="tfld" name="description" defaultValue={line.description} style={{ minWidth: 220 }} />
                  </td>
                  <td>
                    <input form={formId} className="tfld" name="unit" defaultValue={line.unit ?? ""} style={{ width: 60 }} />
                  </td>
                  <td className="n">
                    <input
                      form={formId}
                      className="tfld n"
                      name="qty"
                      type="number"
                      step="any"
                      defaultValue={line.qty ?? ""}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td>
                    <KindPicker form={formId} name="kind" defaultValue={line.kind} compact />
                  </td>
                  <td>
                    <input form={formId} type="checkbox" name="isRequired" defaultChecked={line.isRequired} />
                  </td>
                  <td>
                    <input form={formId} type="checkbox" name="submittalRequired" defaultChecked={line.submittalRequired} />
                  </td>
                  <td>
                    <input
                      form={formId}
                      className="tfld n"
                      name="longLeadWeeks"
                      type="number"
                      defaultValue={line.longLeadWeeks ?? ""}
                      style={{ width: 60 }}
                    />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
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
          </tbody>
        </table>
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
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="lbl" style={{ marginBottom: 10 }}>
          Add scope line
        </div>
        <form
          action={async (fd) => {
            "use server";
            await createScopeLine(number, pkg.id, fd);
          }}
          className="flex flex-col gap-3"
        >
          <div className="cf">
            <div>
              <div className="lbl">CSI code</div>
              <CsiCodeInput className="fld mt-1" name="csiCode" />
            </div>
            <div>
              <div className="lbl">Unit</div>
              <input className="fld mt-1" name="unit" />
            </div>
          </div>
          <div>
            <div className="lbl">Description</div>
            <input className="fld mt-1" name="description" required />
          </div>
          <div className="cf">
            <div>
              <div className="lbl">Qty</div>
              <input className="fld mt-1" name="qty" type="number" step="any" />
            </div>
            <div>
              <div className="lbl mb-1">Kind</div>
              <KindPicker name="kind" defaultValue="inclusion" />
            </div>
          </div>
          <div className="flex gap-4" style={{ fontSize: 13 }}>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isRequired" defaultChecked /> Required
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="submittalRequired" /> Submittal required
            </label>
          </div>
          <div>
            <div className="lbl">Long lead (weeks)</div>
            <input className="fld mt-1" name="longLeadWeeks" type="number" style={{ width: 100 }} />
          </div>
          <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
            Add line
          </button>
        </form>
      </div>
    </div>
  );
}
