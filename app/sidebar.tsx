"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MailIcon, BlocksIcon } from "./icons";

// Nur zwei Bereiche — mehr braucht dieses kleine Tool nicht, deshalb keine
// Primary/Secondary-Trennung wie in stl-prism. Gleiche Sidebar-Mechanik
// (Mobile: Top-Bar + horizontal scrollbare Pills; Desktop: fixierte 240px-
// Spalte) wie stl-inside/stl-prism, damit sich alle drei Apps gleich
// anfühlen.
const NAV_ITEMS = [
  { href: "/", label: "Vorlagen", Icon: MailIcon, activeOn: ["/", "/templates"] },
  { href: "/components", label: "Komponenten", Icon: BlocksIcon, activeOn: ["/components"] },
];

function isActive(pathname: string, activeOn: string[]) {
  return activeOn.some((prefix) => (prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)));
}

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-black/[.06] dark:bg-white/[.1]"
          : "text-zinc-500 hover:bg-black/[.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-100"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: feste 240px-Seitenleiste würde zu viel Breite fressen —
          stattdessen Top-Bar + horizontal scrollbare Nav-Pills (gleiches
          Muster wie stl-inside/stl-prism). */}
      <div className="flex md:hidden items-center justify-between border-b border-black/[.08] px-4 py-3 dark:border-white/[.145]">
        <Link href="/" className="text-sm font-bold tracking-tight">
          stl mail
        </Link>
      </div>
      <div className="flex md:hidden items-center gap-1 overflow-x-auto border-b border-black/[.08] px-2 py-2 dark:border-white/[.145]">
        {NAV_ITEMS.map(({ href, label, Icon, activeOn }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isActive(pathname, activeOn) ? "bg-black/[.06] dark:bg-white/[.1]" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {/* Desktop: fixiert, damit sie beim Scrollen sichtbar bleibt —
          Hauptinhalt gleicht die Breite per padding aus (siehe layout.tsx). */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 w-60 border-r border-black/[.08] flex-col dark:border-white/[.145]">
        <div className="h-24 flex items-center border-b border-black/[.08] px-6 dark:border-white/[.145]">
          <Link href="/" className="text-lg font-bold tracking-tight">
            stl mail
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-4 pt-6">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.activeOn)} />
          ))}
        </nav>
      </aside>
    </>
  );
}
