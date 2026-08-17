import Link from "next/link";
import { Fragment, Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { deleteFlag, deleteTag, uploadBidBondTemplate, updateAccountProfile, importTagsCsv } from "./actions";
import { deleteProjectTemplate } from "@/app/actions";
import { AccountMenu, ROLE_LABEL } from "@/components/AccountMenu";
import { getBuildVersion } from "@/lib/version";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { FlagModal } from "./FlagModal";
import { DeleteFlagModal } from "./DeleteFlagModal";
import { TagAddRow } from "./TagAddRow";
import { TemplateModal } from "./TemplateModal";
import { PackageBuilder } from "./PackageBuilder";

export const dynamic = "force-dynamic";

const TAG_TYPE_ORDER = ["location", "requirement", "project_type", "contract_type", "special"] as const;
const TAG_TYPE_LABEL: Record<string, string> = {
  location: "Location",
  requirement: "Requirement",
  project_type: "Project type",
  contract_type: "Contract type",
  special: "Special",
};

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

  const [flags, packageTemplates, tags, bidBondTemplate, projectTemplates, allProjects, session] = await Promise.all([
    prisma.flag.findMany({ orderBy: { label: "asc" }, include: { _count: { select: { projectFlags: true } } } }),
    prisma.packageTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { projectTags: true } } } }),
    prisma.appFile.findUnique({ where: { key: "bid_bond_template" } }),
    prisma.projectTemplate.findMany({ orderBy: { createdAt: "desc" }, include: { packages: true } }),
    prisma.project.findMany({ orderBy: { number: "asc" }, select: { number: true, name: true } }),
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
          <a href="?view=packages" className={view === "packages" ? "on" : undefined}>
            Bid Packages
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
          <div className="flex flex-col gap-4" style={{ maxWidth: 900 }}>
            <div className="flex items-center justify-between">
              <div className="lbl">{flags.length} flags</div>
              <div className="flex items-center gap-2">
                <ExportCsvButton
                  filename="flags.csv"
                  headers={["Label", "Type", "Description", "Used on"]}
                  rows={flags.map((f) => [f.label, f.type, f.description ?? "", f._count.projectFlags])}
                />
                <Link href="?view=flags&flag=new" className="btn btn--acc btn--sm">
                  + New flag
                </Link>
              </div>
            </div>
            <DataTable
              id="settings-flags-tbl"
              columns={
                [
                  { id: "glyph", label: "", width: 40, minWidth: 40, resizable: false, icon: true },
                  { id: "label", label: "Label", width: 280 },
                  { id: "type", label: "Type", width: 120 },
                  { id: "description", label: "Description", width: 280 },
                  { id: "used", label: "Used on", width: 80, align: "right" },
                  { id: "actions", label: "", width: 130, minWidth: 130, resizable: false },
                ] as DataTableColumn[]
              }
            >
              {flags.map((f) => {
                const chipClass = f.color ? `chip chip--${f.color}` : (FLAG_TYPE_CHIP[f.type] ?? "chip");
                return (
                  <tr key={f.id}>
                    <td className="icon">{f.glyph ?? ""}</td>
                    <td>
                      <span className={chipClass}>{f.label}</span>
                    </td>
                    <td style={{ color: "var(--text-dim)" }}>{f.type}</td>
                    <td style={{ color: "var(--text-dim)" }}>{f.description || "—"}</td>
                    <td className="n">{f._count.projectFlags}</td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`?view=flags&flag=${f.id}`} className="btn btn--sm btn--gh">
                          Edit
                        </Link>
                        {f._count.projectFlags > 0 ? (
                          <Link href={`?view=flags&deleteFlag=${f.id}`} className="btn btn--sm btn--gh" style={{ color: "var(--danger-text)" }}>
                            Delete
                          </Link>
                        ) : (
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
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </DataTable>
            <Suspense fallback={null}>
              <FlagModal
                flags={flags.map((f) => ({
                  id: f.id,
                  label: f.label,
                  type: f.type,
                  description: f.description,
                  color: f.color,
                  glyph: f.glyph,
                  parseKeywords: f.parseKeywords,
                }))}
              />
            </Suspense>
            <Suspense fallback={null}>
              <DeleteFlagModal flags={flags.map((f) => ({ id: f.id, label: f.label, usedCount: f._count.projectFlags }))} />
            </Suspense>
          </div>
        )}

        {view === "packages" && (
          <div style={{ maxWidth: 1100 }}>
            <PackageBuilder packages={packageTemplates} />
          </div>
        )}

        {view === "tags" && (
          <div className="flex flex-col gap-4" style={{ maxWidth: 640 }}>
            <div className="flex items-center justify-between">
              <div className="lbl">{tags.length} project tags</div>
              <div className="flex items-center gap-2">
                <a className="btn btn--sm btn--gh" href="/api/tags/export">
                  Export CSV
                </a>
                <form
                  action={async (fd) => {
                    "use server";
                    await importTagsCsv(fd);
                  }}
                  className="flex items-center gap-2"
                >
                  <input className="fld" name="file" type="file" accept=".csv,text/csv" required style={{ width: 160, fontSize: 11.5 }} />
                  <button className="btn btn--sm btn--gh" type="submit">
                    Import CSV
                  </button>
                </form>
              </div>
            </div>
            <DataTable
              id="settings-tags-tbl"
              columns={
                [
                  { id: "name", label: "Name", width: 260 },
                  { id: "used", label: "Used on", width: 90, align: "right" },
                  { id: "actions", label: "", width: 90, minWidth: 90, resizable: false },
                ] as DataTableColumn[]
              }
            >
              {TAG_TYPE_ORDER.map((type) => {
                const groupTags = tags.filter((t) => t.type === type).sort((a, b) => a.name.localeCompare(b.name));
                if (groupTags.length === 0) return null;
                return (
                  <Fragment key={type}>
                    <tr style={{ background: "var(--bg-inset)" }}>
                      <td colSpan={3} style={{ fontWeight: 700 }}>
                        {TAG_TYPE_LABEL[type]}
                      </td>
                    </tr>
                    {groupTags.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td className="n">{t._count.projectTags}</td>
                        <td>
                          <form
                            action={async () => {
                              "use server";
                              await deleteTag(t.id);
                            }}
                            style={{ textAlign: "right" }}
                          >
                            <button className="btn btn--sm btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              <TagAddRow colSpan={3} />
            </DataTable>
          </div>
        )}

        {view === "templates" && (
          <div className="flex flex-col gap-6" style={{ maxWidth: 900 }}>
            <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 24 }}>
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
            </div>

            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <div className="lbl">Project templates</div>
                <Link href="?view=templates&template=new" className="btn btn--acc btn--sm">
                  + New template
                </Link>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 12 }}>
                Bid package structure and bidder lists only, no cost data or scope line items. For
                setting up future manual projects.
              </p>
              {projectTemplates.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>None saved yet.</p>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, padding: 0 }}>
                  {projectTemplates.map((t) => {
                    const bidderCount = t.packages.reduce((sum, p) => sum + (Array.isArray(p.bidders) ? p.bidders.length : 0), 0);
                    return (
                      <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                        <p style={{ fontSize: 12.5, color: "var(--text-dim)", flex: 1, margin: 0 }}>
                          {t.description || "No description."}
                        </p>
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                          {t.packages.length} package{t.packages.length === 1 ? "" : "s"} · {bidderCount} bidder{bidderCount === 1 ? "" : "s"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                          Saved {t.createdAt.toLocaleDateString()}
                          {t.updatedAt.getTime() !== t.createdAt.getTime() && ` · revised ${t.updatedAt.toLocaleDateString()}`}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Link href={`?view=templates&template=${t.id}`} className="btn btn--sm btn--gh">
                            Edit
                          </Link>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Suspense fallback={null}>
              <TemplateModal
                templates={projectTemplates.map((t) => ({ id: t.id, name: t.name, description: t.description }))}
                projects={allProjects}
              />
            </Suspense>
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
