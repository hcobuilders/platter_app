import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/format";
import {
  updateProjectBonding,
  setBidBondRequired,
  addProjectFlag,
  removeProjectFlag,
  verifyProjectAddress,
  addHotItem,
  removeHotItem,
} from "./actions";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { FlagChip } from "@/components/FlagChip";
import { KeyDatesTimeline, MiniMap } from "./OverviewWidgets";

export const dynamic = "force-dynamic";

const FLAG_TYPE_CHIP: Record<string, string> = {
  requirement: "chip chip--dgr",
  informational: "chip chip--info",
  risk: "chip chip--risk",
};

async function getProjectDetail(number: string) {
  return prisma.project.findUnique({
    where: { number },
    include: {
      dates: { orderBy: { at: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
      bidPackages: {
        include: { scopeLineItems: true, invitations: { include: { subcontractor: true, bids: true } } },
      },
      budgetLines: true,
      projectFlags: { include: { flag: true } },
    },
  });
}

async function addFlagOrBidBond(projectNumber: string, value: string) {
  "use server";
  if (value === "BID_BOND") {
    await setBidBondRequired(projectNumber, true);
  } else if (value) {
    await addProjectFlag(projectNumber, value);
  }
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const project = await getProjectDetail(number);
  if (!project) notFound();

  const allFlags = await prisma.flag.findMany({ orderBy: { label: "asc" } });
  const attachedFlagIds = new Set(project.projectFlags.map((pf) => pf.flagId));
  const unattachedFlags = allFlags.filter((f) => !attachedFlagIds.has(f.id));

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
      </section>

      <section>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Address
        </div>
        <div style={{ font: "var(--t-body)" }}>{project.address ?? "—"}</div>
        {project.address && (
          <div className="mt-3">
            {project.addressVerifiedAt && project.lat != null && project.lng != null ? (
              <>
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <span className="chip chip--ok">Verified</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>as of {project.addressVerifiedAt.toLocaleDateString()}</span>
                </div>
                <MiniMap lat={project.lat} lng={project.lng} />
              </>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await verifyProjectAddress(number);
                }}
              >
                <button className="btn btn--sm" type="submit">
                  Verify address
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Key dates
        </div>
        <div className="card" style={{ padding: "10px 4px 16px" }}>
          <KeyDatesTimeline dates={project.dates} />
        </div>
        {project.dates.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {project.dates.map((d) => (
              <div key={d.id} className="flex justify-between items-center" style={{ fontSize: 13 }}>
                <span className="lbl" style={{ display: "inline" }}>
                  {d.kind.replace(/_/g, " ")}
                </span>
                <span className="mono">
                  {d.at.toLocaleDateString()}
                  {d.isMandatory && <span style={{ color: "var(--danger-text)", marginLeft: 8 }}>Mandatory</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Bonding
        </div>
        <form
          id="bonding-form"
          action={async (fd) => {
            "use server";
            await updateProjectBonding(number, fd);
          }}
          className="flex items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <span className="lbl" style={{ margin: 0 }}>
              P&amp;P
            </span>
            <AutoSubmitSelect
              form="bonding-form"
              name="pAndPMode"
              className="fld"
              defaultValue={project.pAndPMode ?? ""}
              options={[
                { value: "", label: "— not set —" },
                { value: "in_base", label: "In base bid" },
                { value: "alternate", label: "Alternate" },
              ]}
            />
          </div>
        </form>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 8 }}>
          Bid bond required now lives as a flag below — add it there to require one (and get a one-click download).
        </p>
      </section>

      <section>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Flags
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {project.bidBondRequired && (
            <FlagChip
              label="Bid bond required"
              className="chip chip--dgr"
              href="/api/bid-bond-template"
              title="Click to download the bid bond template · right-click to remove"
              removeFormId="rm-bidbond"
            />
          )}
          {project.projectFlags.map((pf) => (
            <FlagChip
              key={pf.id}
              label={pf.flag.label}
              className={FLAG_TYPE_CHIP[pf.flag.type] ?? "chip"}
              title="Right-click to remove"
              removeFormId={`rm-flag-${pf.id}`}
            />
          ))}
          {project.projectFlags.length === 0 && !project.bidBondRequired && <span style={{ color: "var(--text-faint)" }}>None</span>}

          {(unattachedFlags.length > 0 || !project.bidBondRequired) && (
            <form
              action={async (fd) => {
                "use server";
                await addFlagOrBidBond(number, String(fd.get("flag") ?? ""));
              }}
              className="flex items-center gap-2"
            >
              <select className="fld" name="flag" style={{ width: "auto", fontSize: 11.5, padding: "6px 9px" }} defaultValue="">
                <option value="" disabled>
                  + Add flag…
                </option>
                {!project.bidBondRequired && <option value="BID_BOND">Bid bond required</option>}
                {unattachedFlags.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <button className="btn btn--sm btn--gh" type="submit">
                Add
              </button>
            </form>
          )}
        </div>

        <form
          id="rm-bidbond"
          action={async () => {
            "use server";
            await setBidBondRequired(number, false);
          }}
          style={{ display: "none" }}
        />
        {project.projectFlags.map((pf) => (
          <form
            key={pf.id}
            id={`rm-flag-${pf.id}`}
            action={async () => {
              "use server";
              await removeProjectFlag(number, pf.id);
            }}
            style={{ display: "none" }}
          />
        ))}
      </section>

      <section>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Hot items
        </div>
        <div className="flex flex-col gap-2">
          {project.notes.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None yet — flag anything important below.</p>}
          {project.notes.map((n) => (
            <div key={n.id} className="rule">
              <div className="rtxt">
                {n.body}
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                  Added by {n.author}
                  {n.associatedAt && ` · re: ${n.associatedAt.toLocaleDateString()}`} · {n.createdAt.toLocaleDateString()}
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await removeHotItem(number, n.id);
                }}
              >
                <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 12, maxWidth: 520 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>
            Add hot item
          </div>
          <form
            action={async (fd) => {
              "use server";
              await addHotItem(number, String(fd.get("body") ?? ""), String(fd.get("associatedAt") ?? ""), String(fd.get("author") ?? ""));
            }}
            className="flex flex-col gap-3"
          >
            <input className="fld" name="body" placeholder="What's important here?" required />
            <div className="cf">
              <input className="fld" name="associatedAt" type="date" title="Associated date (optional)" />
              <input className="fld" name="author" placeholder="Your name" defaultValue="Jordan Lee" />
            </div>
            <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
              Add
            </button>
          </form>
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
            {project.bidPackages.map((pkg) => {
              const href = `/projects/${number}/bid-tab?package=${encodeURIComponent(pkg.code)}`;
              return (
                <tr key={pkg.id}>
                  <td className="mono">
                    <Link href={href} style={{ color: "inherit" }}>
                      {pkg.code}
                    </Link>
                  </td>
                  <td>
                    <Link href={href} style={{ color: "inherit" }}>
                      {pkg.name}
                    </Link>
                  </td>
                  <td>{pkg.scopeLineItems.length}</td>
                  <td>{pkg.invitations.length}</td>
                  <td className="n mono">{formatCents(pkg.budgetAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 8 }}>
          Click a package to open its bid tab. Bond requirements for a package show there now, not here.
        </p>
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
