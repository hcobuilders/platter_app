"use client";

import { useEffect } from "react";

// Adds drag-to-resize handles to a <table id={tableId}>'s header cells,
// without owning the table's JSX — it finds the live DOM node post-render
// and augments it. Locks in each column's current (auto-computed) width
// before switching to table-layout:fixed, so turning resize on doesn't
// itself shift anything; widths persist per-browser via localStorage.
export function ResizableColumns({ tableId }: { tableId: string }) {
  useEffect(() => {
    const table = document.getElementById(tableId);
    if (!(table instanceof HTMLTableElement)) return;
    const headRow = table.tHead?.rows[0];
    if (!headRow) return;

    const storageKey = `platter:colwidths:${tableId}`;
    let saved: Record<string, number> = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {
      // Corrupt or inaccessible localStorage — fall back to measured widths.
    }

    const ths = Array.from(headRow.cells);
    ths.forEach((th, i) => {
      const w = saved[String(i)] ?? th.getBoundingClientRect().width;
      th.style.width = `${w}px`;
    });
    table.style.tableLayout = "fixed";

    const teardown: Array<() => void> = [];

    ths.forEach((th, i) => {
      if (i === ths.length - 1) return;
      if (th.querySelector(":scope > .col-resize-handle")) return;
      // Sticky columns (bid-tab's description column) already establish a
      // positioned container — forcing position:relative inline would win
      // over the stylesheet's position:sticky and break the sticky column.
      if (getComputedStyle(th).position === "static") th.style.position = "relative";

      const handle = document.createElement("div");
      handle.className = "col-resize-handle";
      th.appendChild(handle);

      let startX = 0;
      let startWidth = 0;

      function onPointerMove(e: PointerEvent) {
        th.style.width = `${Math.max(40, startWidth + (e.clientX - startX))}px`;
      }
      function onPointerUp() {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        const widths: Record<string, number> = {};
        ths.forEach((t, idx) => {
          widths[String(idx)] = t.getBoundingClientRect().width;
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(widths));
        } catch {
          // Best-effort persistence only.
        }
      }
      function onPointerDown(e: PointerEvent) {
        startX = e.clientX;
        startWidth = th.getBoundingClientRect().width;
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
        e.preventDefault();
      }

      handle.addEventListener("pointerdown", onPointerDown);
      teardown.push(() => {
        handle.removeEventListener("pointerdown", onPointerDown);
        handle.remove();
      });
    });

    return () => teardown.forEach((fn) => fn());
  }, [tableId]);

  return null;
}
