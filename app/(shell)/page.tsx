import Link from "next/link";
import { listTemplates } from "../../lib/mail-templates";
import { ContentPage } from "../content-page";

// Notion ist die Datenquelle, nicht statisch cachebar — ohne dies versucht
// Next beim Build eine statische Seite zu erzeugen und schlägt fehl, sobald
// die Notion-Integration (noch) keinen Zugriff auf die Datenquellen hat.
export const dynamic = "force-dynamic";

export default async function Home() {
  const templates = await listTemplates();

  return (
    <ContentPage
      title="Vorlagen"
      subtitle="Mail Templates aus Notion — Komponenten, Inhalte und Vorschau."
    >
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
    </ContentPage>
  );
}
