"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { deleteFlag } from "./actions";

export type DeletableFlag = { id: string; label: string; usedCount: number };

// "deleting requires reassignment if in use" (E-06, GH #19) — a flag
// with projects on it doesn't just vanish off them; this is the prompt
// that lets the owner move those projects onto a replacement flag first,
// or explicitly choose to strip the flag off everything instead.
export function DeleteFlagModal({ flags }: { flags: DeletableFlag[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("deleteFlag");
  if (!targetId) return null;

  const target = flags.find((f) => f.id === targetId);
  if (!target) return null;

  const others = flags.filter((f) => f.id !== targetId);

  function close() {
    router.push("?view=flags");
  }

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk" style={{ maxWidth: 440 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            Delete &ldquo;{target.label}&rdquo;
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
            Used on {target.usedCount} project{target.usedCount === 1 ? "" : "s"}. Reassign them to another flag first, or delete to
            remove it from all of them.
          </p>
        </div>
        <form
          action={async (fd) => {
            const reassignToId = String(fd.get("reassignToId") ?? "");
            await deleteFlag(target.id, reassignToId || undefined);
            close();
          }}
          className="flex flex-col gap-3"
          style={{ padding: 18 }}
        >
          {others.length > 0 && (
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Reassign to (optional)
              </div>
              <select className="fld" name="reassignToId" defaultValue="">
                <option value="">Don&apos;t reassign — just remove it</option>
                {others.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button className="btn btn--acc" type="submit" style={{ background: "var(--danger-fill)", borderColor: "var(--danger-fill)" }}>
              Delete flag
            </button>
            <button className="btn btn--gh" type="button" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
