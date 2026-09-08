import Link from "next/link";
import { getTemplateById, resolveTemplateBlocks, listComponents } from "../../../lib/mail-templates";
import { TemplateEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [template, components] = await Promise.all([getTemplateById(id), listComponents()]);
  const blocks = resolveTemplateBlocks(template, components);
  // Banner/Footer sind strukturelle Components, keine wählbaren Bloecke —
  // im "+ Block"-Picker sollen nur die eigentlichen Inhalts-Bausteine
  // erscheinen.
  const pickableComponents = components.filter((c) => c.name !== "Banner" && c.name !== "Footer");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/[.08] dark:border-white/[.145] px-8 py-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline">
            ← Alle Vorlagen
          </Link>
          <h1 className="text-lg font-semibold mt-1">{template.name}</h1>
        </div>
      </header>

      <TemplateEditor
        template={template}
        initialBlocks={blocks}
        components={pickableComponents}
        allComponents={components}
      />
    </div>
  );
}
