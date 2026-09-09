import { Sidebar } from "../sidebar";

// Sidebar-Shell für alle Seiten, die sie brauchen (aktuell nur die
// Vorlagen-Liste) — Templates/Komponenten bearbeiten liegen bewusst
// außerhalb dieser Route-Gruppe und laufen als voller Screen (siehe
// app/layout.tsx).
export default function ShellLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar />
      {/* md:pl-60 gleicht die Breite der fixierten Sidebar aus (siehe
          sidebar.tsx). Jede Seite rendert ihre eigene <ContentPage>. */}
      <div className="flex flex-1 flex-col md:pl-60">{children}</div>
    </div>
  );
}
