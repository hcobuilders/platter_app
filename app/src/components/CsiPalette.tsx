"use client";

import { useEffect, useRef, useState } from "react";
import { findCsiMatches, type CsiCode } from "@/lib/csi-codes";

// CSI code palette — press Cmd/Ctrl+K, or select "csi" from the main
// command bar (/), to search MasterFormat codes and copy one to the
// clipboard. The "/csi" text-buffer trigger was retired once "/" became the
// main app command bar's own trigger character (they collided).
export function CsiPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function openPalette() {
    setOpen(true);
    setQuery("");
    setActiveIdx(0);
    setCopied(null);
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("platter:open-csi", openPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("platter:open-csi", openPalette);
    };
  }, []);

  const matches: CsiCode[] = query.trim().length >= 1 ? findCsiMatches(query, 12) : findCsiMatches("0", 12);

  async function copy(code: CsiCode) {
    const text = `${code.code} ${code.title}`;
    try {
      await navigator.clipboard.writeText(code.code);
    } catch {
      // Clipboard API unavailable (insecure context, permissions) — still
      // show the code so the user can copy it manually.
    }
    setCopied(text);
    setTimeout(() => setOpen(false), 500);
  }

  if (!open) return null;

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="cmdk" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk__input"
          placeholder="Search CSI MasterFormat codes or titles…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && matches[activeIdx]) {
              e.preventDefault();
              copy(matches[activeIdx]);
            }
          }}
        />
        <div className="cmdk__list">
          {matches.map((m, i) => (
            <div
              key={m.code}
              className={`cmdk__row${i === activeIdx ? " active" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={() => copy(m)}
            >
              <span className="mono">{m.code}</span>
              <span>{m.title}</span>
            </div>
          ))}
          {matches.length === 0 && (
            <div className="cmdk__row" style={{ color: "var(--text-faint)" }}>
              No matching CSI codes
            </div>
          )}
        </div>
        <div className="cmdk__hint">{copied ? `Copied "${copied}"` : "↑↓ to navigate · Enter to copy code · Esc to close"}</div>
      </div>
    </div>
  );
}
