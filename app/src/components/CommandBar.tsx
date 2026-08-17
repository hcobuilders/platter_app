"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCommandRegistry } from "@/app/shell-actions";

type RegistryProject = { number: string; name: string; bidPackages: { code: string; name: string }[] };

const TOOLS: Array<{ keywords: string[]; label: string; path: string }> = [
  { keywords: ["overview", "home"], label: "Overview", path: "" },
  { keywords: ["work-packages", "workpackages", "scope", "itb", "invite"], label: "Work Packages", path: "/work-packages" },
  { keywords: ["bid-tab", "bidtab", "level", "leveling"], label: "Bid tab", path: "/bid-tab" },
  { keywords: ["budget"], label: "Budget", path: "/budget" },
];

type Row = { key: string; left: string; right: string; kind: string; run: () => void };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function CommandBar({ currentProjectNumber }: { currentProjectNumber?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<RegistryProject[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [noMatch, setNoMatch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const noMatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (open) return;
      if (e.key !== "/" || isTypingTarget(e.target)) return;
      if (e.target instanceof HTMLInputElement) return; // don't hijack "/" while typing in a form field
      e.preventDefault();
      setOpen(true);
      if (!projects) getCommandRegistry().then(setProjects);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, projects]);

  function resolveProject(token: string, list: RegistryProject[]): RegistryProject | undefined {
    const t = token.toLowerCase();
    return (
      list.find((p) => p.number.toLowerCase() === t) ||
      list.find((p) => p.number.toLowerCase().startsWith(t)) ||
      list.find((p) => initials(p.name).toLowerCase() === t) ||
      list.find((p) => p.name.toLowerCase().includes(t))
    );
  }

  function computeRows(): Row[] {
    const list = projects ?? [];
    const q = query.trim();
    if (!q) {
      const rows: Row[] = [
        { key: "new", left: "new", right: "New project", kind: "⌘N", run: () => router.push("/?new=1") },
        { key: "csi", left: "csi", right: "Search CSI MasterFormat codes", kind: "⌘K", run: () => window.dispatchEvent(new CustomEvent("platter:open-csi")) },
      ];
      if (currentProjectNumber) {
        for (const t of TOOLS) {
          rows.push({
            key: t.path,
            left: t.keywords[0],
            right: `This project → ${t.label}`,
            kind: "Tool",
            run: () => router.push(`/projects/${currentProjectNumber}${t.path}`),
          });
        }
      }
      for (const p of list.slice(0, 4)) {
        rows.push({ key: p.number, left: p.number, right: p.name, kind: "Open project", run: () => router.push(`/projects/${p.number}`) });
      }
      return rows;
    }

    const parts = q.split(/\s+/);
    const last = parts[parts.length - 1].toLowerCase();
    const tool = TOOLS.find((t) => t.keywords.includes(last));

    if (tool && parts.length > 1) {
      const projTok = parts.slice(0, -1).join(" ");
      const proj = resolveProject(projTok, list);
      if (proj) {
        return [
          {
            key: "tool-match",
            left: q,
            right: `${proj.name} → ${tool.label}`,
            kind: "Tool",
            run: () => router.push(`/projects/${proj.number}${tool.path}`),
          },
        ];
      }
    }

    if (tool && currentProjectNumber && parts.length === 1) {
      return [
        {
          key: "tool-current",
          left: q,
          right: `This project → ${tool.label}`,
          kind: "Tool",
          run: () => router.push(`/projects/${currentProjectNumber}${tool.path}`),
        },
      ];
    }

    if (parts.length > 1) {
      const projTok = parts[0];
      const pkgCode = parts[1].toUpperCase();
      const proj = resolveProject(projTok, list);
      if (proj) {
        const pkg = proj.bidPackages.find((p) => p.code.toUpperCase() === pkgCode);
        if (pkg) {
          return [
            {
              key: "pkg-match",
              left: q,
              right: `${proj.name} → Package ${pkg.code} ${pkg.name}`,
              kind: "Open package",
              run: () => router.push(`/projects/${proj.number}/work-packages?package=${pkg.code}`),
            },
          ];
        }
      }
    }

    const matches = list.filter(
      (p) => p.number.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase()) || initials(p.name).toLowerCase().startsWith(q.toLowerCase())
    );
    return matches.slice(0, 8).map((p) => ({
      key: p.number,
      left: p.number,
      right: p.name,
      kind: "Open project",
      run: () => router.push(`/projects/${p.number}`),
    }));
  }

  const rows = projects !== null || query.trim() === "" ? computeRows() : [];

  useEffect(() => {
    if (noMatchTimer.current) clearTimeout(noMatchTimer.current);
    if (query.trim() && projects) {
      noMatchTimer.current = setTimeout(() => {
        setNoMatch(rows.length === 0);
      }, 400);
    }
    return () => {
      if (noMatchTimer.current) clearTimeout(noMatchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, projects]);

  function close() {
    setOpen(false);
    setQuery("");
    setNoMatch(false);
    inputRef.current?.blur();
  }

  return (
    <div className="cmdwrap">
      {open && rows.length > 0 && (
        <div className="cmdpanel">
          {query.trim() === "" && <div className="cmdsec">Commands</div>}
          {rows.map((r, i) => (
            <div
              key={r.key}
              className={`cmdrow${i === activeIdx ? " on" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={() => {
                r.run();
                close();
              }}
            >
              <span>{r.left}</span>
              <span>{r.right}</span>
              <span className="k">{r.kind}</span>
            </div>
          ))}
        </div>
      )}
      <div className={`cmd${noMatch ? " err" : ""}`} onClick={() => inputRef.current?.focus()}>
        <span className="sl">/</span>
        <input
          ref={inputRef}
          value={query}
          placeholder="Type a command or a project number"
          onFocus={() => {
            setOpen(true);
            if (!projects) getCommandRegistry().then(setProjects);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
            setNoMatch(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              close();
              e.currentTarget.blur();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, rows.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && rows[activeIdx]) {
              rows[activeIdx].run();
              close();
            }
          }}
        />
        {noMatch && <span style={{ color: "var(--danger-fill)" }}>Not recognized</span>}
        <kbd style={{ marginLeft: "auto" }}>esc</kbd>
      </div>
    </div>
  );
}
