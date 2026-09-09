import type { ReactNode } from "react";

// 1:1 Pattern von stl-inside/app/(portal)/top-bar.tsx und
// stl-prism/app/top-bar.tsx — jede Seite füllt sie selbst, bleibt aber auf
// Höhe der Marken-Zone der Sidebar (h-24).
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 hidden h-24 shrink-0 items-center justify-between gap-4 border-b border-black/[.08] bg-background px-10 md:flex dark:border-white/[.145]">
      {children}
    </div>
  );
}
