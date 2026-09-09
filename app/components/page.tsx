import { listComponents } from "../../lib/mail-templates";
import { FullscreenHeader } from "../fullscreen-header";
import { ComponentCard } from "./editor";

export const dynamic = "force-dynamic";

// Bewusst außerhalb der (shell)-Gruppe, gleiches Muster wie
// templates/[id] — die Design/Vorschau-Editoren je Komponente brauchen die
// volle Breite, keine Sidebar.
export default async function ComponentsPage() {
  const components = await listComponents();

  return (
    <div className="flex min-h-screen flex-col">
      <FullscreenHeader title="Mail Components" backHref="/" backLabel="Alle Vorlagen" />
      <main className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mb-4">
          Hier wird nur das visuelle Design eines Bausteins gepflegt (das HTML-Fragment + welche
          Felder er hat). Der konkrete Inhalt einer einzelnen Mail wird pro Vorlage in den
          jeweiligen Blöcken gepflegt, nicht hier.
        </p>
        {components.map((c) => (
          <ComponentCard key={c.id} component={c} />
        ))}
      </main>
    </div>
  );
}
