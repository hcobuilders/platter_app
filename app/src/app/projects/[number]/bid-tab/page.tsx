import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCents } from "@/lib/format";
import { acceptPlug, acceptSubAddedAsScopeLine, trackOnlySubAdded, setLineIncluded } from "./actions";

export const dynamic = "force-dynamic";

async function getPackage(number: string, packageCode?: string) {
  const project = await prisma.project.findUnique({
    where: { number },
    include: {
      bidPackages: {
        include: {
          scopeLineItems: { orderBy: { seq: "asc" } },
          invitations: {
            include: {
              subcontractor: true,
              bids: { include: { bidLines: true }, orderBy: { submittedAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!project) return null;
  const pkg = packageCode
    ? project.bidPackages.find((p) => p.code === packageCode)
    : project.bidPackages[0];
  return pkg ?? null;
}

const KIND_LABEL: Record<string, string> = {
  inclusion: "Inc",
  exclusion: "Exc",
  alternate: "Alt",
  allowance: "Allow",
  unit_price: "Unit $",
  clarification: "Clar",
  va_option: "VA",
};

const SOURCE_LABEL: Record<string, string> = {
  sub: "Sub",
  parsed: "Parsed",
  plug: "Plug",
  ours: "GC est.",
};

export default async function BidTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { number } = await params;
  const { package: packageCode } = await searchParams;
  const pkg = await getPackage(number, packageCode);
  if (!pkg) notFound();

  const invitations = pkg.invitations;

  // invitationId -> Map<scopeLineItemId, bidLine>
  const matchedByInvitation = new Map<string, Map<string, (typeof invitations)[number]["bids"][number]["bidLines"][number]>>();
  const subAddedByInvitation = new Map<string, (typeof invitations)[number]["bids"][number]["bidLines"]>();

  for (const inv of invitations) {
    const bid = inv.bids[0];
    const matched = new Map<string, (typeof bid.bidLines)[number]>();
    const subAdded: (typeof bid.bidLines) = [];
    if (bid) {
      for (const line of bid.bidLines) {
        if (line.scopeLineItemId) matched.set(line.scopeLineItemId, line);
        else subAdded.push(line);
      }
    }
    matchedByInvitation.set(inv.id, matched);
    subAddedByInvitation.set(inv.id, subAdded);
  }

  function recommendedPlug(scopeLineItemId: string, excludeInvitationId: string): bigint | null {
    const values: bigint[] = [];
    for (const inv of invitations) {
      if (inv.id === excludeInvitationId) continue;
      const line = matchedByInvitation.get(inv.id)?.get(scopeLineItemId);
      if (line && line.included) values.push(line.amount);
    }
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0n) / BigInt(values.length);
    return (avg * 92n) / 100n;
  }

  // Base bid total: sum of inclusion-kind lines' matched+included amounts.
  const inclusionLines = pkg.scopeLineItems.filter((l) => l.kind === "inclusion");
  const altVaLines = pkg.scopeLineItems.filter((l) => l.kind === "alternate" || l.kind === "va_option");
  function packageTotal(invId: string): { total: bigint; complete: boolean } {
    let total = 0n;
    let complete = true;
    for (const line of inclusionLines) {
      const matched = matchedByInvitation.get(invId)?.get(line.id);
      if (matched && matched.included) total += matched.amount;
      else complete = false;
    }
    return { total, complete };
  }
  // Base bid plus whichever alternates/VA options the GC has accepted (per
  // the toggle above) — the number that actually reflects a decision, not
  // just the fixed-scope base.
  function totalWithAccepted(invId: string): { total: bigint; complete: boolean; acceptedCount: number } {
    const base = packageTotal(invId);
    let total = base.total;
    let acceptedCount = 0;
    for (const line of altVaLines) {
      const matched = matchedByInvitation.get(invId)?.get(line.id);
      if (matched && matched.included) {
        total += matched.amount;
        acceptedCount++;
      }
    }
    return { total, complete: base.complete, acceptedCount };
  }

  const pendingSubAdded = invitations.flatMap((inv) =>
    subAddedByInvitation.get(inv.id)!.filter((l) => l.scopeLineItemId === null && l.included).map((l) => ({ inv, line: l }))
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="legend">
        <span>
          <i style={{ background: "var(--success-fill)" }} />
          Sub-stated
        </span>
        <span>
          <i style={{ background: "var(--info-fill)" }} />
          Parsed from upload
        </span>
        <span>
          <i style={{ background: "var(--danger-fill)", borderRadius: 2 }} />
          Plug
        </span>
      </div>

      <div className="bwrap">
        <table className="bidtbl">
          <thead>
            <tr>
              <th className="desc">
                {pkg.code} — {pkg.name}
              </th>
              {invitations.map((inv) => (
                <th key={inv.id}>{inv.subcontractor.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pkg.scopeLineItems.map((line) => (
              <tr key={line.id}>
                <td className="desc">
                  {line.description}{" "}
                  <span className={`kb kb--${line.kind}`} style={{ marginLeft: 4 }}>
                    {KIND_LABEL[line.kind]}
                  </span>
                </td>
                {invitations.map((inv) => {
                  if (inv.intent === "no_bid") {
                    return (
                      <td key={inv.id} style={{ color: "var(--text-faint)", textAlign: "center" }}>
                        No bid
                      </td>
                    );
                  }
                  if (!inv.bids[0]) {
                    return (
                      <td key={inv.id} style={{ color: "var(--text-faint)", textAlign: "center" }}>
                        Pending
                      </td>
                    );
                  }
                  const matched = matchedByInvitation.get(inv.id)?.get(line.id);
                  if (!matched) {
                    const plug = recommendedPlug(line.id, inv.id);
                    return (
                      <td key={inv.id}>
                        <span className="gapc">Gap</span>
                        {plug !== null && (
                          <form
                            action={async () => {
                              "use server";
                              await acceptPlug(number, inv.bids[0].id, line.id, plug);
                            }}
                            className="mt-1"
                          >
                            <div style={{ fontSize: 10.5, color: "var(--text-dim)" }}>
                              Suggest {formatCents(plug)}
                            </div>
                            <button className="btn btn--sm btn--acc mt-1" type="submit">
                              Accept plug
                            </button>
                          </form>
                        )}
                      </td>
                    );
                  }
                  const isAltOrVA = line.kind === "alternate" || line.kind === "va_option";
                  return (
                    <td key={inv.id} className="n">
                      <span style={matched.included ? undefined : { color: "var(--text-faint)", textDecoration: "line-through" }}>
                        {formatCents(matched.amount)}
                      </span>
                      <div className={`srcb srcb--${matched.source}`}>
                        <i />
                        {SOURCE_LABEL[matched.source]}
                        {matched.confidence ? ` · ${matched.confidence.toFixed(2)}` : ""}
                      </div>
                      {isAltOrVA && (
                        <form
                          action={async () => {
                            "use server";
                            await setLineIncluded(number, matched.id, !matched.included);
                          }}
                          className="mt-1"
                        >
                          <button
                            type="submit"
                            className={matched.included ? "chip chip--ok" : "chip chip--dgr"}
                            style={{ cursor: "pointer", border: "none" }}
                            title="GC decision — click to toggle whether this alternate/VA price counts toward the budget"
                          >
                            {matched.included ? "Included in budget" : "Not included"}
                          </button>
                        </form>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="desc" style={{ fontWeight: 700 }}>
                Package total (included)
              </td>
              {invitations.map((inv) => {
                if (inv.intent === "no_bid" || !inv.bids[0]) {
                  return (
                    <td key={inv.id} style={{ textAlign: "center" }}>
                      —
                    </td>
                  );
                }
                const { total, complete } = packageTotal(inv.id);
                return (
                  <td key={inv.id} className="n" style={{ fontWeight: 700, color: complete ? undefined : "var(--danger-text)" }}>
                    {complete ? formatCents(total) : "Incomplete"}
                  </td>
                );
              })}
            </tr>
            {altVaLines.length > 0 && (
              <tr>
                <td className="desc" style={{ fontWeight: 700, color: "var(--text-dim)" }}>
                  + accepted alternates/VA
                </td>
                {invitations.map((inv) => {
                  if (inv.intent === "no_bid" || !inv.bids[0]) {
                    return (
                      <td key={inv.id} style={{ textAlign: "center" }}>
                        —
                      </td>
                    );
                  }
                  const { total, complete, acceptedCount } = totalWithAccepted(inv.id);
                  return (
                    <td key={inv.id} className="n" style={{ fontWeight: 700, color: complete ? "var(--text-dim)" : "var(--danger-text)" }}>
                      {complete ? (
                        <>
                          {formatCents(total)}
                          <div style={{ fontSize: 10.5, fontWeight: 400 }}>
                            {acceptedCount} accepted
                          </div>
                        </>
                      ) : (
                        "Incomplete"
                      )}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingSubAdded.length > 0 && (
        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>
            {pendingSubAdded.length} line{pendingSubAdded.length > 1 ? "s" : ""} awaiting disposition
          </div>
          <div className="flex flex-col gap-2">
            {pendingSubAdded.map(({ inv, line }) => (
              <div key={line.id} className="card">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div style={{ font: "600 14px var(--font-display)" }}>{line.note}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
                      {inv.subcontractor.name} · {formatCents(line.amount)}
                    </div>
                  </div>
                  <span className="chip chip--dgr">Sub-added</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <form
                    action={async () => {
                      "use server";
                      await acceptSubAddedAsScopeLine(number, line.id, pkg.id);
                    }}
                  >
                    <button className="btn btn--sm btn--acc" type="submit">
                      Accept as new scope line
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await trackOnlySubAdded(number, line.id);
                    }}
                  >
                    <button className="btn btn--sm btn--gh" type="submit">
                      Track only, exclude from total
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
