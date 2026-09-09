import { getTemplateById, resolveTemplateBlocks, listComponents } from "../../../lib/mail-templates";
import { FullscreenHeader } from "../../fullscreen-header";
import { TemplateEditor } from "./editor";

export const dynamic = "force-dynamic";

// Bewusst außerhalb der (shell)-Gruppe, damit diese Seite ohne Sidebar als
// voller Screen läuft (gleiches Muster wie stl-inside/app/tickets/new) —
// der zweispaltige Editor + Live-Vorschau braucht die volle Breite.
export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [template, components] = await Promise.all([getTemplateById(id), listComponents()]);
  const blocks = resolveTemplateBlocks(template, components);
  // Footer ist die einzige noch strukturelle Component (eigener Vorlagen-
  // Schalter statt Teil der Bloecke-Liste) — Banner ist inzwischen ein
  // normaler "Bild"-Baustein und taucht deshalb im Picker mit auf.
  const pickableComponents = components.filter((c) => c.name !== "Footer");

  return (
    <div className="flex min-h-screen flex-col">
      <FullscreenHeader title={template.name} backHref="/" backLabel="Alle Vorlagen" />
      <main className="flex-1 min-h-0 flex flex-col">
        <TemplateEditor
          template={template}
          initialBlocks={blocks}
          components={pickableComponents}
          allComponents={components}
        />
      </main>
    </div>
  );
}
