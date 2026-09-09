import { getComponentById } from "../../../lib/mail-templates";
import { ComponentEditor } from "./editor";

export const dynamic = "force-dynamic";

// Bewusst außerhalb der (shell)-Gruppe, gleiches Muster wie
// templates/[id] — Design-Editor + Live-Vorschau brauchen die volle
// Breite, keine Sidebar. Der Header (inkl. Speichern-Button) lebt in
// ComponentEditor selbst, weil der Button den Client-seitigen
// Dirty-/Speicher-Status kennen muss.
export default async function ComponentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const component = await getComponentById(id);

  return <ComponentEditor component={component} />;
}
