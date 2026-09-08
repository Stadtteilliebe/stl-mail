import Link from "next/link";
import { listComponents } from "../../lib/mail-templates";
import { ComponentCard } from "./editor";

export const dynamic = "force-dynamic";

export default async function ComponentsPage() {
  const components = await listComponents();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/[.08] dark:border-white/[.145] px-8 py-6">
        <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline">
          ← Alle Vorlagen
        </Link>
        <h1 className="text-lg font-semibold mt-1">Mail Components</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
          Hier wird nur das visuelle Design eines Bausteins gepflegt (das HTML-Fragment + welche
          Felder er hat). Der konkrete Inhalt einer einzelnen Mail wird pro Vorlage in den
          jeweiligen Blöcken gepflegt, nicht hier.
        </p>
      </header>

      <main className="flex-1 px-8 py-8 max-w-3xl w-full mx-auto space-y-3">
        {components.map((c) => (
          <ComponentCard key={c.id} component={c} />
        ))}
      </main>
    </div>
  );
}
