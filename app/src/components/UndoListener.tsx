"use client";

import { useEffect } from "react";
import { popUndo } from "@/lib/undoStack";

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

// Ctrl/Cmd+Z reverts the most recently autosaved table field (budget
// current/buyout/awarded-to edits) back to its pre-edit value and
// resubmits, so the revert round-trips through the same server action and
// persists. Only fires when focus isn't inside a text field, so normal
// in-progress typing keeps the browser's native per-field undo.
export function UndoListener() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      if (isTypingTarget(e.target)) return;
      const entry = popUndo();
      if (!entry) return;
      e.preventDefault();
      const input = document.querySelector<HTMLInputElement>(`[form="${entry.formId}"][name="${entry.fieldName}"]`);
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, entry.prevValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.form?.requestSubmit();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
