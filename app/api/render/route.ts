import { NextRequest, NextResponse } from "next/server";
import { getTemplateBySlug, listComponents, resolveTemplateBlocks } from "../../../lib/mail-templates";
import { renderTemplate } from "../../../lib/mail-render";

// Von n8n aufgerufen, um eine Notion-gepflegte Vorlage mit den Laufzeit-
// Werten aus einem Workflow (z.B. dem "Neues Ticket"-Webhook in stl-inside)
// zu einer versandfertigen Mail zusammenzubauen. Einziger Ort, an dem die
// Rendering-Logik läuft — dieselbe wie im Editor, damit Vorschau und
// tatsächlich versendete Mail nie auseinanderlaufen.
//
// Server-zu-Server-Aufruf (n8n), kein Browser — deshalb kein Session-
// Cookie wie beim Rest der App (proxy.ts schließt diese Route bewusst aus),
// sondern ein statischer API-Key-Header, den n8n mitschickt.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!process.env.STL_MAIL_API_KEY || apiKey !== process.env.STL_MAIL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const slug = body?.slug;
  const tokens = body?.tokens ?? {};

  if (!slug) {
    return NextResponse.json({ error: "slug fehlt" }, { status: 400 });
  }

  const template = await getTemplateBySlug(slug);
  if (!template) {
    return NextResponse.json({ error: `Keine Vorlage mit Webhook-Slug "${slug}"` }, { status: 404 });
  }
  if (template.status !== "Active") {
    return NextResponse.json({ error: `Vorlage "${slug}" ist nicht aktiv (Status: ${template.status})` }, { status: 409 });
  }

  const components = await listComponents();
  const blocks = resolveTemplateBlocks(template, components);
  const { subject, html } = renderTemplate(template, blocks, components, tokens);

  return NextResponse.json({ subject, html });
}
