import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/format";
import { getSeenIds } from "@/lib/seen";
import {
  updateProjectBonding,
  setBidBondRequired,
  addProjectFlag,
  removeProjectFlag,
  verifyProjectAddress,
  setNoticeToProceed,
  addChangeOrder,
  removeChangeOrder,
} from "./actions";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { FlagChip } from "@/components/FlagChip";
import { Tooltip } from "@/components/Tooltip";
import { GanttTimeline, MiniMap, GoogleMapsLink } from "./OverviewWidgets";
import { EditableOverviewFields } from "./EditableOverviewFields";
import { HotItemsList } from "./HotItemsList";
import { CommunicationLog } from "./CommunicationLog";
import { ScheduleGantt } from "./ScheduleGantt";
import { ScheduleImportModal } from "./ScheduleImportModal";

export const dynamic = "force-dynamic";

const FLAG_TYPE_CHIP: Record<string, string> = {
  requirement: "chip chip--dgr",
  informational: "chip chip--info",
  risk: "chip chip--risk",
};

const STATUS_CHIP: Record<string, string> = {
  draft: "",
  scoping: "chip--info",
  bidding: "chip--info",
  leveling: "chip--acc",
  submitted: "chip--acc",
  awarded: "chip--ok",
  lost: "chip--dgr",
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
      changeOrders: { orderBy: { createdAt: "desc" } },
      communications: { orderBy: { at: "desc" }, include: { subcontractor: { select: { name: true } } } },
      scheduleActivities: {
        orderBy: { seq: "asc" },
        include: {
          predecessorLinks: { include: { predecessor: { select: { id: true, name: true } } } },
          successorLinks: { include: { successor: { select: { id: true, name: true } } } },
        },
      },
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
  const [project, session, scheduleDisplaySetting, bidBondTemplate] = await Promise.all([
    getProjectDetail(number),
    auth(),
    prisma.scheduleDisplaySetting.findUnique({ where: { key: "global" } }),
    prisma.appFile.findUnique({ where: { key: "bid_bond_template" } }),
  ]);
  if (!project) notFound();
  const scheduleRowHeight = scheduleDisplaySetting?.rowHeight ?? 30;

  const seenHotItemIds = session?.user?.id
    ? await getSeenIds(
        session.user.id,
        "hot_item",
        project.notes.map((n) => n.id)
      )
    : new Set<string>();

  const allFlags = await prisma.flag.findMany({ orderBy: { label: "asc" } });
  const attachedFlagIds = new Set(project.projectFlags.map((pf) => pf.flagId));
  const unattachedFlags = allFlags.filter((f) => !attachedFlagIds.has(f.id));

  const totalBudget = project.budgetLines.reduce((sum, b) => sum + b.current, 0n);
  const changeOrderDays = project.changeOrders.reduce((s, co) => s + co.days, 0);
  const isAwarded = project.status === "awarded";
  const invitedSubs = new Set(project.bidPackages.flatMap((p) => p.invitations.map((i) => i.subcontractorId))).size;
  const subOptions = Array.from(
    new Map(
      project.bidPackages.flatMap((p) => p.invitations.map((i) => [i.subcontractorId, i.subcontractor.name] as const))
    )
  ).map(([id, name]) => ({ id, name }));

  return (
    <div className="flex flex-col gap-5">
      <section className="statrow">
        <div className="statrow__item">
          <div className="lbl">Current budget</div>
          <div className="mono statrow__v">{formatCents(totalBudget)}</div>
        </div>
        <div className="statrow__item">
          <div className="lbl">Bid packages</div>
          <div className="mono statrow__v">{project.bidPackages.length}</div>
        </div>
        <div className="statrow__item">
          <div className="lbl">Subs invited</div>
          <div className="mono statrow__v">{invitedSubs}</div>
        </div>
        <div className="statrow__item">
          <div className="lbl">Contract days</div>
          <div className="mono statrow__v">
            {project.contractDays ?? "—"}
            {changeOrderDays !== 0 && (
              <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 400 }}>
                {" "}
                ({changeOrderDays > 0 ? "+" : ""}
                {changeOrderDays} CO)
              </span>
            )}
          </div>
        </div>
        <div className="statrow__item">
          <div className="lbl">Status</div>
          <div className="statrow__v">
            <span className={`chip ${STATUS_CHIP[project.status] ?? ""}`}>{project.status}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="ov2col">
          <EditableOverviewFields
            projectNumber={number}
            initial={{
              owner: project.owner,
              architectOfRecord: project.architectOfRecord,
              deliveryMethod: project.deliveryMethod,
              status: project.status,
              bondPct: project.bondPct,
              retainagePct: project.retainagePct,
              contractDays: project.contractDays,
              squareFootage: project.squareFootage,
            }}
          />

          <div className="flex flex-col gap-5">
            <div>
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
                      <div className="mt-2">
                        <GoogleMapsLink lat={project.lat} lng={project.lng} address={project.address} />
                      </div>
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
            </div>

            <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>
                Project controls
              </div>

              <form
                id="bonding-form"
                action={async (fd) => {
                  "use server";
                  await updateProjectBonding(number, fd);
                }}
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
                Bid bond required lives as a flag below — add it there to require one (and get a one-click download).
              </p>

              <div className="mt-3 flex gap-2 flex-wrap items-center">
                {project.bidBondRequired && (() => {
                  const isAdmin = session?.user?.role === "admin";
                  const alreadyDownloaded = Boolean(project.bidBondDownloadedAt) && !isAdmin;
                  const canDownload = Boolean(bidBondTemplate) && !alreadyDownloaded;
                  return (
                    <span className="flex items-center gap-1">
                      <FlagChip
                        label="Bid bond required"
                        className="chip chip--dgr"
                        href={canDownload ? `/api/bid-bond-template?project=${encodeURIComponent(number)}` : undefined}
                        title={
                          canDownload
                            ? "Click to download the bid bond template · right-click to remove"
                            : "Right-click to remove"
                        }
                        removeFormId="rm-bidbond"
                      />
                      {/* No hard-navigation link to a 404/403 JSON response
                          for either edge case (S-notes v135a475: "dont
                          show an entire error page ... only show a red
                          notification next to the bubble") — a small dot
                          + tooltip instead of a dead link. */}
                      {!bidBondTemplate && (
                        <Tooltip label={"No template uploaded yet.\nUpload one in Settings → Templates."}>
                          <span className="dot" style={{ background: "var(--danger-fill)", cursor: "default" }} />
                        </Tooltip>
                      )}
                      {bidBondTemplate && alreadyDownloaded && (
                        <Tooltip
                          label={`Already downloaded for this project (${project.bidBondDownloadedAt!.toLocaleDateString()}).\nOnly one download is allowed — an admin can re-download if needed.`}
                        >
                          <span className="dot" style={{ background: "var(--text-faint)", cursor: "default" }} />
                        </Tooltip>
                      )}
                    </span>
                  );
                })()}
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
              </div>

              {(unattachedFlags.length > 0 || !project.bidBondRequired) && (
                <form
                  action={async (fd) => {
                    "use server";
                    await addFlagOrBidBond(number, String(fd.get("flag") ?? ""));
                  }}
                  className="flex items-center gap-2 mt-2"
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
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid var(--border-hairline)", paddingTop: 20 }}>
          <HotItemsList
            projectNumber={number}
            initial={project.notes.map((n) => ({
              id: n.id,
              body: n.body,
              author: n.author,
              state: n.state,
              associatedAt: n.associatedAt,
              createdAt: n.createdAt,
              isNew: !seenHotItemIds.has(n.id),
            }))}
          />
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid var(--border-hairline)", paddingTop: 20 }}>
          <CommunicationLog
            projectNumber={number}
            subs={subOptions}
            initial={project.communications.map((c) => ({
              id: c.id,
              kind: c.kind,
              body: c.body,
              author: c.author,
              at: c.at,
              subcontractorName: c.subcontractor?.name ?? null,
            }))}
          />
        </div>
      </section>

      <div className="ov2col-eq">
        <section className="card">
          <div className="lbl" style={{ marginBottom: 8 }}>
            Key dates
          </div>
          <GanttTimeline dates={project.dates} contractDays={project.contractDays} changeOrderDays={changeOrderDays} />
          <form
            action={async (fd) => {
              "use server";
              await setNoticeToProceed(number, String(fd.get("noticeToProceedAt") ?? ""));
            }}
            className="flex items-center gap-2"
            style={{ marginTop: 12, borderTop: "1px solid var(--border-hairline)", paddingTop: 12 }}
          >
            <span className="lbl" style={{ margin: 0 }}>
              Notice to proceed
            </span>
            <input
              className="fld"
              type="date"
              name="noticeToProceedAt"
              defaultValue={project.dates.find((d) => d.kind === "notice_to_proceed")?.at.toISOString().slice(0, 10) ?? ""}
              style={{ width: "auto" }}
            />
            <button className="btn btn--sm" type="submit">
              Save
            </button>
          </form>
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
            Starts the awarded-status schedule clock (elapsed / completion date / days remaining).
          </p>
        </section>

        <section className="card">
          <div className="lbl" style={{ marginBottom: 8 }}>
            Change orders
          </div>
          {!isAwarded ? (
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
              Available once this project is <span className="mono">awarded</span> — set status above.
            </p>
          ) : (
            <>
              {project.changeOrders.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {project.changeOrders.map((co) => (
                    <div key={co.id} className="rule">
                      <div className="rtxt">
                        {co.description}
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                          {co.days !== 0 && `${co.days > 0 ? "+" : ""}${co.days} days · `}
                          {formatCents(co.value)} · {co.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await removeChangeOrder(number, co.id);
                        }}
                      >
                        <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                          Remove
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
              <form
                action={async (fd) => {
                  "use server";
                  await addChangeOrder(
                    number,
                    String(fd.get("description") ?? ""),
                    Number(fd.get("days") ?? 0),
                    Number(fd.get("value") ?? 0)
                  );
                }}
                className="flex items-center gap-2 mt-3"
                style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 12 }}
              >
                <input className="fld" name="description" placeholder="Description" required style={{ flex: 1 }} />
                <input className="fld" name="days" type="number" placeholder="Days ±" style={{ width: 90 }} />
                <input className="fld" name="value" type="number" step="0.01" placeholder="Value $ ±" style={{ width: 120 }} />
                <button className="btn btn--sm btn--acc" type="submit">
                  Add
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="lbl">Schedule</div>
          <Link href={`/projects/${number}?importSchedule=1`} className="btn btn--sm btn--gh">
            Import P6 schedule (.xer)
          </Link>
        </div>
        <ScheduleGantt
          projectNumber={number}
          activities={project.scheduleActivities.map((a) => ({
            ...a,
            predecessorLinks: a.predecessorLinks.map((l) => ({ id: l.id, type: l.type, activity: l.predecessor })),
            successorLinks: a.successorLinks.map((l) => ({ id: l.id, type: l.type, activity: l.successor })),
          }))}
          rowHeight={scheduleRowHeight}
        />
        <Suspense fallback={null}>
          <ScheduleImportModal projectNumber={number} />
        </Suspense>
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="lbl" style={{ padding: "16px 16px 0" }}>
          Bid packages
        </div>
        <table className="tbl mt-2" style={{ borderRadius: 0 }}>
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
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", padding: "8px 16px 16px" }}>
          Click a package to open its bid tab. Bond requirements for a package show there now, not here.
        </p>
      </section>

      <section className="card">
        <div className="lbl">Current budget total</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {formatCents(totalBudget)}
        </div>
      </section>
    </div>
  );
}
