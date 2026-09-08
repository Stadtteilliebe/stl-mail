import Link from "next/link";
import { listTemplates } from "../lib/mail-templates";

// Notion ist die Datenquelle, nicht statisch cachebar — ohne dies versucht
// Next beim Build eine statische Seite zu erzeugen und schlägt fehl, sobald
// die Notion-Integration (noch) keinen Zugriff auf die Datenquellen hat.
export const dynamic = "force-dynamic";

export default async function Home() {
  const templates = await listTemplates();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/[.08] dark:border-white/[.145] px-8 py-6">
        <h1 className="text-lg font-semibold">stl mail</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Mail Templates aus Notion — Komponenten, Inhalte und Vorschau.
        </p>
      </header>

      <main className="flex-1 px-8 py-8 max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Vorlagen
          </h2>
          <Link
            href="/components"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
          >
            Komponenten verwalten →
          </Link>
        </div>

        {templates.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Keine Vorlagen gefunden. In Notion prüfen, ob die Integration Zugriff auf
            &quot;Mail Templates&quot; hat.
          </p>
        )}

        <ul className="divide-y divide-black/[.08] dark:divide-white/[.145] rounded-lg border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-zinc-950">
          {templates.map((t) => (
            <li key={t.id}>
              <Link
                href={`/templates/${t.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-black/[.03] dark:hover:bg-white/[.06]"
              >
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    /{t.slug || "—"}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === "Active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {t.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
