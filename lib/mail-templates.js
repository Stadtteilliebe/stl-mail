import {
  getDataSourceByTitle,
  getRows,
  getPage,
  readProp,
  parseJsonProp,
  toJsonProp,
  updatePageProperties,
  richTextValue,
  checkboxValue,
  selectValue,
} from "./notion";

// Nur noch zwei Notion-Datenquellen — siehe Konzept-Dokument ("Mail-
// Baukasten"): Mail Components (Design je Baustein-Typ) und Mail Templates
// (eine Mail pro Zeile, inkl. ihrer Bausteine als "Blocks"-JSON direkt auf
// der Vorlage). Es gibt bewusst keine separate Bloecke-Tabelle mehr (vormals
// "Mail Pattern") — eine Vorlage referenziert ihre Komponenten direkt.
async function templatesDs() {
  return getDataSourceByTitle("Mail Templates");
}
async function componentsDs() {
  return getDataSourceByTitle("Mail Components");
}

function templateFromPage(page) {
  const p = page.properties;
  return {
    id: page.id,
    name: readProp(p["Name"]),
    slug: readProp(p["Webhook-Slug"]),
    subject: readProp(p["Betreff"]) || "",
    bannerEnabled: !!readProp(p["Banner aktiv"]),
    bannerVariant: readProp(p["Banner-Variante"]) || "light",
    footerEnabled: !!readProp(p["Footer aktiv"]),
    status: readProp(p["Status"]) || "Draft",
    // Rohe Bloecke: [{ componentId, enabled, content }], Reihenfolge = Array-
    // Reihenfolge. Muessen mit listComponents() aufgeloest werden (siehe
    // resolveTemplateBlocks), damit jeder Block sein component-Objekt hat.
    blocks: parseJsonProp(readProp(p["Blocks"]), []),
  };
}

function componentFromPage(page) {
  const p = page.properties;
  return {
    id: page.id,
    name: readProp(p["Name"]),
    description: readProp(p["Beschreibung"]) || "",
    designHtml: readProp(p["Design HTML"]) || "",
    fieldSchema: parseJsonProp(readProp(p["Feldschema"]), []),
    status: readProp(p["Status"]) || "Draft",
  };
}

export async function listTemplates() {
  const ds = await templatesDs();
  const pages = await getRows(ds.id);
  return pages.map(templateFromPage).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTemplateById(id) {
  return templateFromPage(await getPage(id));
}

export async function getTemplateBySlug(slug) {
  const ds = await templatesDs();
  const pages = await getRows(ds.id, {
    property: "Webhook-Slug",
    rich_text: { equals: slug },
  });
  const page = pages[0];
  return page ? templateFromPage(page) : null;
}

export async function listComponents() {
  const ds = await componentsDs();
  const pages = await getRows(ds.id);
  return pages.map(componentFromPage).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getComponentById(id) {
  return componentFromPage(await getPage(id));
}

// Loest die rohen Bloecke einer Vorlage (nur componentId/enabled/content)
// gegen die volle Komponentenliste auf, damit jeder Block sein component-
// Objekt (Design HTML + Feldschema) traegt — genau das, was
// lib/mail-render.js zum Rendern braucht.
export function resolveTemplateBlocks(template, components) {
  const componentById = Object.fromEntries(components.map((c) => [c.id, c]));
  return template.blocks.map((b) => ({ ...b, component: componentById[b.componentId] ?? null }));
}

// Schreibt die komplette Bloecke-Liste einer Vorlage in einem Rutsch zurueck
// — Hinzufuegen/Entfernen/Umsortieren/Inhalt-Aendern sind für Notion alle
// dieselbe Operation: "Blocks"-Property der Vorlage ersetzen.
export async function updateTemplateBlocks(templateId, blocks) {
  const cleaned = blocks.map(({ componentId, enabled, content }) => ({ componentId, enabled, content }));
  return updatePageProperties(templateId, { Blocks: richTextValue(toJsonProp(cleaned)) });
}

export async function updateTemplateMeta(templateId, fields) {
  const properties = {};
  if (fields.subject !== undefined) properties["Betreff"] = richTextValue(fields.subject);
  if (fields.bannerEnabled !== undefined) properties["Banner aktiv"] = checkboxValue(fields.bannerEnabled);
  if (fields.bannerVariant !== undefined) properties["Banner-Variante"] = selectValue(fields.bannerVariant);
  if (fields.footerEnabled !== undefined) properties["Footer aktiv"] = checkboxValue(fields.footerEnabled);
  return updatePageProperties(templateId, properties);
}

export async function updateComponent(componentId, fields) {
  const properties = {};
  if (fields.designHtml !== undefined) properties["Design HTML"] = richTextValue(fields.designHtml);
  if (fields.description !== undefined) properties["Beschreibung"] = richTextValue(fields.description);
  if (fields.fieldSchema !== undefined) properties["Feldschema"] = richTextValue(toJsonProp(fields.fieldSchema));
  return updatePageProperties(componentId, properties);
}
