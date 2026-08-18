"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

export type DataTableColumn = {
  id: string;
  label: React.ReactNode;
  width?: number;
  minWidth?: number;
  align?: "left" | "right" | "center";
  sticky?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  /** Compact padding + no ellipsis clipping — for checkbox/icon-only columns too narrow for the default text padding. */
  icon?: boolean;
};

// Persisted column widths, read via useSyncExternalStore rather than a
// useEffect + setState — this is the mechanism React 18 actually wants for
// "hydrate from a browser-only store without an SSR mismatch": the server
// (and first client paint, pre-hydration) always sees EMPTY, then React
// itself reconciles in whatever a real localStorage read turns up, no
// manual effect/cascading-render involved.
const EMPTY: Record<string, number> = {};
const cache = new Map<string, Record<string, number>>();
const listeners = new Map<string, Set<() => void>>();

function readStorage(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : EMPTY;
  } catch {
    return EMPTY;
  }
}
function getSnapshot(key: string) {
  if (!cache.has(key)) cache.set(key, readStorage(key));
  return cache.get(key)!;
}
function getServerSnapshot() {
  return EMPTY;
}
function subscribe(key: string, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => listeners.get(key)!.delete(cb);
}
function writeWidths(key: string, next: Record<string, number>) {
  cache.set(key, next);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Best-effort persistence only.
  }
  listeners.get(key)?.forEach((cb) => cb());
}

// Global table system (S-batch #67). Replaces the old ResizableColumns +
// .tbl/.bidtbl split. Column widths live in a <colgroup>, keyed by stable
// column id (not index) and persisted per table id — so resizing one
// column only ever changes that column's own width. The table's own width
// is the sum of its columns with no fixed cap (min-width:100% only), so
// widening a column grows the table into .dtwrap's horizontal scroll
// instead of the old bug where a fixed 100% container forced every other
// column to shrink to compensate.
//
// <thead> is rendered generically from `columns` (this is what keeps
// header cells and their resize handles in sync with column state); tbody
// content stays caller-authored via children, since cell-editing logic
// (arrow-key nav, autosave forms, etc.) is too bespoke per table to
// abstract without rewriting it. Body cells that need sticky/alignment
// still carry their own className ("dt-sticky", "n") matching the column.
export function DataTable({
  id,
  columns,
  dense,
  footer,
  children,
}: {
  id: string;
  columns: DataTableColumn[];
  dense?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const storageKey = `platter:dt:${id}`;
  const widths = useSyncExternalStore(
    useCallback((cb) => subscribe(storageKey, cb), [storageKey]),
    () => getSnapshot(storageKey),
    getServerSnapshot
  );
  const tableRef = useRef<HTMLTableElement>(null);

  const widthFor = useCallback((col: DataTableColumn) => widths[col.id] ?? col.width ?? 140, [widths]);

  const visibleColumns = columns.filter((c) => !c.hidden);

  const handlePointerDown = useCallback(
    (col: DataTableColumn, e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = widthFor(col);
      const startTableWidth = tableRef.current?.getBoundingClientRect().width ?? 0;
      const minWidth = col.minWidth ?? 60;
      const colEl = tableRef.current?.querySelector<HTMLTableColElement>(`col[data-col-id="${CSS.escape(col.id)}"]`);
      const target = e.currentTarget;
      target.classList.add("is-active");

      // Live-drag preview mutates the DOM directly rather than React state
      // (for a smooth 60fps feel), but must grow the table's own width in
      // lockstep with the dragged column — otherwise table-layout:fixed
      // shrinks every other column to keep the table's still-stale total
      // width unchanged, which is the exact bug this component exists to
      // fix, just re-appearing mid-drag instead of after it.
      function onMove(ev: PointerEvent) {
        const w = Math.max(minWidth, startWidth + (ev.clientX - startX));
        if (colEl) colEl.style.width = `${w}px`;
        if (tableRef.current) tableRef.current.style.width = `${startTableWidth + (w - startWidth)}px`;
      }
      function onUp(ev: PointerEvent) {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        target.classList.remove("is-active");
        const w = Math.max(minWidth, startWidth + (ev.clientX - startX));
        writeWidths(storageKey, { ...getSnapshot(storageKey), [col.id]: w });
      }
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [storageKey, widthFor]
  );

  const totalWidth = visibleColumns.reduce((sum, c) => sum + widthFor(c), 0);

  return (
    <div className="dtwrap">
      <table
        ref={tableRef}
        id={id}
        className={`dtbl${dense ? " dtbl--dense" : ""}`}
        style={{ width: "100%", minWidth: totalWidth }}
      >
        <colgroup>
          {visibleColumns.map((col) => (
            <col key={col.id} data-col-id={col.id} style={{ width: widthFor(col) }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {visibleColumns.map((col, i) => (
              <th
                key={col.id}
                className={[col.align === "right" ? "n" : col.align === "center" ? "ctr" : "", col.sticky ? "dt-sticky" : "", col.icon ? "icon" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.label}
                {col.resizable !== false && i < visibleColumns.length - 1 && (
                  <div className="dt-col-resize" onPointerDown={(e) => handlePointerDown(col, e)} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}
