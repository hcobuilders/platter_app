import Link from "next/link";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { createFlag, deleteFlag, createTrade, deleteTrade, createTag, deleteTag } from "./actions";

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

  const [flags, trades, tags] = await Promise.all([
    prisma.flag.findMany({ orderBy: { label: "asc" }, include: { _count: { select: { projectFlags: true } } } }),
    prisma.trade.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { projectTags: true } } } }),
  ]);

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
          <div className="avatar">JL</div>
        </div>
      </div>
      <div style={{ background: "var(--bg-surface)", minHeight: "calc(100vh - 55px)", padding: "24px 28px" }}>
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
                <input className="fld" name="csiCode" placeholder="CSI code" />
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
      </div>
    </div>
  );
}
