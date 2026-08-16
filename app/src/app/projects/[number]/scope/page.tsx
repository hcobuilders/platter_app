import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { createScopeLine, updateScopeLine, deleteScopeLine } from "./actions";

export const dynamic = "force-dynamic";

const KIND_OPTIONS = [
  "inclusion",
  "exclusion",
  "alternate",
  "allowance",
  "unit_price",
  "clarification",
  "va_option",
] as const;

const KIND_LABEL: Record<string, string> = {
  inclusion: "Inc",
  exclusion: "Exc",
  alternate: "Alt",
  allowance: "Allow",
  unit_price: "Unit $",
  clarification: "Clar",
  va_option: "VA",
};

async function getPackages(number: string) {
  const project = await prisma.project.findUnique({
    where: { number },
    include: {
      bidPackages: {
        include: { scopeLineItems: { orderBy: { seq: "asc" } } },
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

  const pkg = packageCode
    ? project.bidPackages.find((p) => p.code === packageCode)
    : project.bidPackages[0];

  if (!pkg) {
    return <p style={{ color: "var(--text-dim)" }}>No bid packages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {project.bidPackages.length > 1 && (
        <div className="tabs">
          {project.bidPackages.map((p) => (
            <a
              key={p.id}
              href={`?package=${p.code}`}
              className={p.id === pkg.id ? "on" : undefined}
            >
              {p.code} {p.name}
            </a>
          ))}
        </div>
      )}

      <div>
        <div className="lbl">
          Scope worksheet — {pkg.code} {pkg.name}
        </div>
        <table className="tbl mt-2">
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
                    <input form={formId} className="tfld mono" name="csiCode" defaultValue={line.csiCode ?? ""} style={{ width: 90 }} />
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
                    <select form={formId} className="tfld" name="kind" defaultValue={line.kind} style={{ minWidth: 90 }}>
                      {KIND_OPTIONS.map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                    <span className={`kb kb--${line.kind}`} style={{ marginLeft: 6 }}>
                      {KIND_LABEL[line.kind]}
                    </span>
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
              <input className="fld mt-1" name="csiCode" />
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
              <div className="lbl">Kind</div>
              <select className="fld mt-1" name="kind" defaultValue="inclusion">
                {KIND_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]} — {k.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
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
