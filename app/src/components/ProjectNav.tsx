"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "", label: "Overview", enabled: true },
  { href: "/scope", label: "Scope", enabled: true },
  { href: "/itb", label: "ITB", enabled: true },
  { href: "/planroom", label: "Planroom", enabled: false },
  { href: "/bid-tab", label: "Bid tab", enabled: true },
  { href: "/budget", label: "Budget", enabled: true },
  { href: "/documents", label: "Documents", enabled: false },
];

export function ProjectNav({ number }: { number: string }) {
  const pathname = usePathname();
  const base = `/projects/${number}`;

  return (
    <nav className="pnav">
      {navItems.map((item) => {
        const href = `${base}${item.href}`;
        const isOn = item.enabled && (pathname === href || (item.href === "" && pathname === base));

        if (!item.enabled) {
          return (
            <a key={item.href} className="is-disabled" title="Not built yet" aria-disabled>
              <span className="dot2" />
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.href} href={href} className={isOn ? "on" : undefined}>
            <span className="dot2" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
