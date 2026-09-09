import type { ReactNode } from "react";
import { TopBar } from "./top-bar";

// 1:1 Pattern von stl-inside/app/(portal)/content-page.tsx und
// stl-prism/app/content-page.tsx.
export function ContentPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <TopBar>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions}
      </TopBar>
      <main className="flex-1 min-w-0 px-4 py-14 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-7xl">
          {subtitle && <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">{subtitle}</p>}
          {children}
        </div>
      </main>
    </>
  );
}
