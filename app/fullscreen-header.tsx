import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "./icons";

// 1:1 Muster von stl-inside/app/tickets/new/page.tsx — Zurück-Link links,
// Titel absolut zentriert, gleiche Höhe wie die Sidebar-Markenzone (h-24 ab
// sm, h-16 auf Mobile). Für Seiten außerhalb der (shell)-Gruppe, die als
// voller Screen ohne Sidebar laufen (Templates/Komponenten bearbeiten).
// "actions" rechts (z.B. Speichern-Button) — Titel bleibt unabhängig davon
// absolut zentriert, wächst also nicht mit der Aktions-Breite mit.
export function FullscreenHeader({
  title,
  backHref,
  backLabel = "Zurück",
  actions,
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 relative flex h-16 shrink-0 items-center justify-between border-b border-black/[.08] bg-background px-4 sm:h-24 sm:px-10 dark:border-white/[.145]">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0" />
        {backLabel}
      </Link>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
}
