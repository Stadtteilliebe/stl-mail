import { getComponentById } from "../../../lib/mail-templates";
import { FullscreenHeader } from "../../fullscreen-header";
import { ComponentEditor } from "./editor";

export const dynamic = "force-dynamic";

// Bewusst außerhalb der (shell)-Gruppe, gleiches Muster wie
// templates/[id] — Design-Editor + Live-Vorschau brauchen die volle
// Breite, keine Sidebar.
export default async function ComponentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const component = await getComponentById(id);

  return (
    <div className="flex min-h-screen flex-col">
      <FullscreenHeader title={component.name} backHref="/components" backLabel="Alle Komponenten" />
      <main className="flex-1 min-h-0 flex flex-col">
        <ComponentEditor component={component} />
      </main>
    </div>
  );
}
