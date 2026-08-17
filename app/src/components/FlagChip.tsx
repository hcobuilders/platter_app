"use client";

import { useEffect, useRef, useState } from "react";

// A flag pill that right-clicks to remove — used on the project overview
// Flags section (S-batch #42). Pass `href` to make left-click do something
// too (e.g. the bid bond flag downloads the template) instead of nothing.
export function FlagChip({
  label,
  className = "chip chip--dgr",
  href,
  removeFormId,
  title,
}: {
  label: string;
  className?: string;
  href?: string;
  removeFormId: string;
  title?: string;
}) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuPos) return;
    const close = () => setMenuPos(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menuPos]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const chip = href ? (
    <a href={href} className={className} title={title} onContextMenu={handleContextMenu}>
      {label}
    </a>
  ) : (
    <span className={className} title={title} onContextMenu={handleContextMenu} style={{ cursor: "context-menu" }}>
      {label}
    </span>
  );

  return (
    <>
      {chip}
      {menuPos && (
        <div ref={menuRef} className="rowmenu" style={{ position: "fixed", top: menuPos.y, left: menuPos.x, right: "auto" }}>
          <button
            type="button"
            style={{ color: "var(--danger-text)" }}
            onClick={() => {
              setMenuPos(null);
              (document.getElementById(removeFormId) as HTMLFormElement | null)?.requestSubmit();
            }}
          >
            Remove
          </button>
        </div>
      )}
    </>
  );
}
