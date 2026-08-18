"use client";

import { useEffect } from "react";

// S-notes v135a475: "suppress normal right click everywhere there isnt a
// menu defined on right click. only allow copy paste etc." A document-level
// listener added last in the bubble phase — any component's own
// onContextMenu handler (FlagChip's remove menu, ScheduleGantt's activity
// menu, etc.) runs first and calls preventDefault() itself when it opens a
// real menu, so this only ever suppresses the native browser menu where
// nothing already claimed the event. Keyboard copy/paste (Ctrl/Cmd+C/V)
// is a separate input path entirely and is untouched by this.
export function SuppressContextMenu() {
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      if (!e.defaultPrevented) e.preventDefault();
    }
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  return null;
}
