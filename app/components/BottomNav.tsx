"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "History" },
  { href: "/insights", label: "Insights" },
  { href: "/planning", label: "Plans" },
  { href: "/wallets", label: "Wallets" },
  { href: "/settings", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav"
      aria-label="Primary"
      data-count={links.length}
      style={{ "--tab-count": links.length } as CSSProperties}
    >
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
