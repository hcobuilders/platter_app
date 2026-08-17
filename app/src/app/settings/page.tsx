import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { createFlag, deleteFlag, createTrade, deleteTrade, createTag, deleteTag, uploadBidBondTemplate, updateAccountProfile } from "./actions";
import { deleteProjectTemplate } from "@/app/actions";
import { CsiCodeInput } from "@/components/CsiCodeInput";
import { AccountMenu, ROLE_LABEL } from "@/components/AccountMenu";
import { getBuildVersion } from "@/lib/version";

export const dynamic = "force-dynamic";

const FLAG_TYPE_CHIP: Record<string, string> = {
  requirement: "chip chip--dgr",
  informational: "chip chip--info",
  risk: "chip chip--risk",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "flags" } = await searchParams;

  const [flags, trades, tags, bidBondTemplate, projectTemplates, session] = await Promise.all([
    prisma.flag.findMany({ orderBy: { label: "asc" }, include: { _count: { select: { projectFlags: true } } } }),
    prisma.trade.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { projectTags: true } } } }),
    prisma.appFile.findUnique({ where: { key: "bid_bond_template" } }),
    prisma.projectTemplate.findMany({ orderBy: { createdAt: "desc" }, include: { packages: true } }),
    auth(),
  ]);

  const currentUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;

  return (
    <div style={{ background: "var(--bg-shell)", minHeight: "100vh" }}>
      <div className="topnav">
        <div className="left">
          <Link href="/" className="logo">
            <Logo />
          </Link>
          <Link href="/" className="crumb">
            / Settings /
          </Link>
        </div>
        <div className="center">
          <span className="pname">Settings</span>
        </div>
        <div className="right">
          <span className="mono" style={{ fontSize: 10, color: "var(--text-invert-faint)" }} title="Build version">
            v{getBuildVersion()}
          </span>
          {session?.user && (
            <AccountMenu name={session.user.name ?? session.user.email ?? "Unknown"} role={session.user.role} buildVersion={getBuildVersion()} />
          )}
        </div>
      </div>
      <div style={{ background: "var(--bg-surface)", color: "var(--text)", minHeight: "calc(100vh - 55px)", padding: "24px 28px" }}>
        <div className="tabs">
          <a href="?view=flags" className={view === "flags" ? "on" : undefined}>
            Flags
          </a>
          <a href="?view=trades" className={view === "trades" ? "on" : undefined}>
            Trades
          </a>
          <a href="?view=tags" className={view === "tags" ? "on" : undefined}>
            Tags
          </a>
          <a href="?view=templates" className={view === "templates" ? "on" : undefined}>
            Templates
          </a>
          <a href="?view=account" className={view === "account" ? "on" : undefined}>
            Account
          </a>
        </div>

        {view === "flags" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 640 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 8 }}>
                {flags.length} flags
              </div>
              {flags.map((f) => (
                <div key={f.id} className="rule">
                  <div className="rtxt">
                    <b>{f.label}</b> — {f.description || "no description"}{" "}
                    <span className={FLAG_TYPE_CHIP[f.type]} style={{ marginLeft: 8 }}>
                      {f.type}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 4 }}>
                    Used on {f._count.projectFlags} project{f._count.projectFlags === 1 ? "" : "s"}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await deleteFlag(f.id);
                    }}
                  >
                    <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="lbl" style={{ marginBottom: 10 }}>
                New flag
              </div>
              <form
                action={async (fd) => {
                  "use server";
                  await createFlag(fd);
                }}
                className="flex flex-col gap-3"
              >
                <input className="fld" name="label" placeholder="Label" required />
                <select className="fld" name="type" defaultValue="requirement">
                  <option value="requirement">Requirement</option>
                  <option value="informational">Informational</option>
                  <option value="risk">Risk</option>
                </select>
                <input className="fld" name="description" placeholder="Description (optional)" />
                <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
                  Save flag
                </button>
              </form>
            </div>
          </div>
        )}

        {view === "trades" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 520 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 8 }}>
                {trades.length} trades
              </div>
              {trades.map((t) => (
                <div key={t.id} className="cclist">
                  <span>
                    {t.name} <span style={{ color: "var(--text-faint)", marginLeft: 8 }}>{t.csiCode ? `CSI ${t.csiCode}` : ""}</span>
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await deleteTrade(t.id);
                    }}
                  >
                    <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="lbl" style={{ marginBottom: 10 }}>
                New trade
              </div>
              <form
                action={async (fd) => {
                  "use server";
                  await createTrade(fd);
                }}
                className="cf"
              >
                <input className="fld" name="name" placeholder="Name" required />
                <CsiCodeInput className="fld" name="csiCode" placeholder="CSI code" />
                <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
                  Add trade
                </button>
              </form>
            </div>
          </div>
        )}

        {view === "tags" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 520 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 8 }}>
                {tags.length} project tags
              </div>
              <div className="flex gap-2 flex-wrap">
                {tags.map((t) => (
                  <span key={t.id} className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {t.name}
                    <form
                      action={async () => {
                        "use server";
                        await deleteTag(t.id);
                      }}
                    >
                      <button type="submit" style={{ all: "unset", cursor: "pointer", color: "var(--danger-text)" }}>
                        ×
                      </button>
                    </form>
                  </span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="lbl" style={{ marginBottom: 10 }}>
                New tag
              </div>
              <form
                action={async (fd) => {
                  "use server";
                  await createTag(fd);
                }}
                className="flex gap-3"
              >
                <input className="fld" name="name" placeholder="Name" required />
                <button className="btn btn--acc" type="submit">
                  Add tag
                </button>
              </form>
            </div>
          </div>
        )}

        {view === "templates" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 520 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 8 }}>
                Bid bond template
              </div>
              {bidBondTemplate ? (
                <div className="cclist">
                  <span>
                    {bidBondTemplate.filename}
                    <span style={{ color: "var(--text-faint)", marginLeft: 8, fontSize: 11.5 }}>
                      uploaded {bidBondTemplate.uploadedAt.toLocaleDateString()}
                    </span>
                  </span>
                  <a href="/api/bid-bond-template" className="btn btn--sm">
                    Download
                  </a>
                </div>
              ) : (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No template uploaded yet.</p>
              )}
            </div>
            <div className="card">
              <div className="lbl" style={{ marginBottom: 10 }}>
                {bidBondTemplate ? "Replace template" : "Upload template"}
              </div>
              <form
                action={async (fd) => {
                  "use server";
                  await uploadBidBondTemplate(fd);
                }}
                className="flex flex-col gap-3"
              >
                <input className="fld" name="template" type="file" required />
                <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
                  Upload
                </button>
              </form>
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 10 }}>
                Stored on the app&apos;s own volume for now — will move to SharePoint/OneDrive once
                that integration is wired up. Shown as a download whenever a project or package has
                &quot;Bid bond required&quot; checked.
              </p>
            </div>

            <div>
              <div className="lbl" style={{ marginBottom: 8 }}>
                Project templates
              </div>
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 10 }}>
                Saved from a project&apos;s &quot;Duplicate as template&quot; card action — bid package
                structure and bidder lists only, no cost data or scope line items. For setting up
                future manual projects.
              </p>
              {projectTemplates.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None saved yet.</p>
              ) : (
                projectTemplates.map((t) => {
                  const bidderCount = t.packages.reduce((sum, p) => sum + (Array.isArray(p.bidders) ? p.bidders.length : 0), 0);
                  return (
                    <div key={t.id} className="rule">
                      <div className="rtxt">
                        <b>{t.name}</b>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                          {t.packages.length} package{t.packages.length === 1 ? "" : "s"} · {bidderCount} bidder{bidderCount === 1 ? "" : "s"} ·
                          saved {t.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await deleteProjectTemplate(t.id);
                        }}
                      >
                        <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {view === "account" && currentUser && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 480 }}>
            <div>
              <div className="lbl" style={{ marginBottom: 8 }}>
                Your account
              </div>
              <div className="cf">
                <Field label="Email" value={currentUser.email} />
                <Field label="Role" value={ROLE_LABEL[currentUser.role] ?? currentUser.role} />
              </div>
            </div>
            <form
              action={async (fd) => {
                "use server";
                await updateAccountProfile(fd);
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Name
                </div>
                <input className="fld" name="name" defaultValue={currentUser.name} required />
              </div>
              <div>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Phone
                </div>
                <input className="fld" name="phone" type="tel" defaultValue={currentUser.phone ?? ""} placeholder="(555) 555-5555" />
              </div>
              <div>
                <div className="lbl" style={{ marginBottom: 6 }}>
                  Email signature
                </div>
                <textarea
                  className="fld"
                  name="emailSignature"
                  rows={4}
                  defaultValue={currentUser.emailSignature ?? ""}
                  placeholder={`${currentUser.name}\n${currentUser.email}`}
                  style={{ resize: "vertical" }}
                />
              </div>
              <button className="btn btn--acc" type="submit" style={{ width: "fit-content" }}>
                Save
              </button>
            </form>
          </div>
        )}
      </div>
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
