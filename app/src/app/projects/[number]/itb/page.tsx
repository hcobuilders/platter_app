import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { inviteSubcontractor } from "./actions";
import { ItbTable } from "./ItbTable";

export const dynamic = "force-dynamic";

async function getData(number: string, packageCode?: string) {
  const project = await prisma.project.findUnique({
    where: { number },
    include: {
      bidPackages: {
        include: {
          invitations: { include: { subcontractor: true }, orderBy: { sentAt: "asc" } },
        },
      },
    },
  });
  if (!project) return null;
  const pkg = packageCode
    ? project.bidPackages.find((p) => p.code === packageCode)
    : project.bidPackages[0];
  if (!pkg) return { project, pkg: null, availableSubs: [] };

  const invitedIds = new Set(pkg.invitations.map((i) => i.subcontractorId));
  const allSubs = await prisma.subcontractor.findMany({ orderBy: { name: "asc" } });
  const availableSubs = allSubs.filter((s) => !invitedIds.has(s.id));

  return { project, pkg, availableSubs };
}

export default async function ItbPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { number } = await params;
  const { package: packageCode } = await searchParams;
  const data = await getData(number, packageCode);
  if (!data) notFound();
  const { pkg, availableSubs } = data;

  if (!pkg) {
    return <p style={{ color: "var(--text-dim)" }}>No bid packages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Invited — {pkg.code} {pkg.name}
        </div>
        <ItbTable
          projectNumber={number}
          invitations={pkg.invitations.map((inv) => ({
            id: inv.id,
            subcontractorName: inv.subcontractor.name,
            trades: inv.subcontractor.trades,
            intent: inv.intent,
            sentAt: inv.sentAt,
          }))}
        />
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
          Sending is stubbed for this prototype — &quot;Send ITB&quot; marks the invitation sent
          without calling a real mail provider. Production swaps this for Microsoft Graph
          <span className="mono"> sendMail</span> behind the <span className="mono">Mailer</span>{" "}
          interface (D-14).
        </p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="lbl" style={{ marginBottom: 10 }}>
          Invite a subcontractor
        </div>
        <form
          action={async (fd) => {
            "use server";
            await inviteSubcontractor(number, pkg.id, fd);
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <div className="lbl">Existing subcontractor</div>
            <select className="fld mt-1" name="existingSubcontractorId" defaultValue="">
              <option value="">— none, add new below —</option>
              {availableSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.trades.length ? `(${s.trades.join(", ")})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="cf">
            <div>
              <div className="lbl">Or new sub — name</div>
              <input className="fld mt-1" name="newSubName" />
            </div>
            <div>
              <div className="lbl">Trade</div>
              <input className="fld mt-1" name="newSubTrade" placeholder="e.g. Concrete" />
            </div>
          </div>
          <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
            Add to invite list
          </button>
        </form>
      </div>
    </div>
  );
}
