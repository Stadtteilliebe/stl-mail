import { Client } from "@notionhq/client";

// Der Token bleibt serverseitig — dieses Modul wird nur in Server
// Components/Actions/Route-Handlern importiert, nie im Browser.
export const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Wandelt ein Notion-Property-Objekt in einen einfachen JS-Wert um. Deckt
// alle Notion-Property-Typen ab (Union aus stl-inside/stl-prism/stl-mail) —
// gleiche Funktion 1:1 in allen drei Repos.
export function readProp(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "number":
      return prop.number;
    case "select":
      return prop.select ? prop.select.name : null;
    case "status":
      return prop.status ? prop.status.name : null;
    case "multi_select":
      return prop.multi_select.map((s) => s.name);
    case "date":
      return prop.date ? prop.date.start : null;
    case "checkbox":
      return prop.checkbox;
    case "url":
      return prop.url;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "people":
      return prop.people.map((p) => p.name || "—");
    case "relation":
      return prop.relation.map((r) => r.id);
    case "formula":
      return prop.formula ? prop.formula[prop.formula.type] : null;
    case "rollup":
      return prop.rollup && prop.rollup.type === "number" ? prop.rollup.number : null;
    case "unique_id":
      return prop.unique_id ? prop.unique_id.number : null;
    case "created_time":
      return prop.created_time;
    case "last_edited_time":
      return prop.last_edited_time;
    case "created_by":
      return prop.created_by?.id ?? null;
    default:
      return null;
  }
}

// Die drei Text-Properties "Feldschema" (Mail Components) und "Inhalt"
// (Mail Pattern) tragen JSON, aber mit einem "json:"-Präfix: die
// Notion-API lehnt eine Property vom Typ "text" ab, deren kompletter Wert
// sich als JSON-Array/-Objekt parsen lässt (offenbar eine interne
// Validierungs-Heuristik) — ohne Präfix bricht das Anlegen/Ändern von
// Zeilen mit "Invalid input" ab. Der Präfix ist rein technisch und wird
// beim Lesen/Schreiben transparent entfernt/ergänzt.
export function parseJsonProp(text, fallback) {
  if (!text) return fallback;
  const raw = text.startsWith("json:") ? text.slice(5) : text;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function toJsonProp(value) {
  return `json:${JSON.stringify(value)}`;
}

// Baut die von der Notion-REST-API erwarteten Property-Value-Objekte —
// notion.pages.update() nimmt (anders als die MCP-Notion-Tools, die eine
// bequeme Kurzschreibweise mit rohen Strings/Booleans anbieten) ausschließlich
// diese vollständig typisierten Objekte an. Wichtig: text.content wird von
// der SDK/API 1:1 als Literal übernommen, es findet KEIN Markdown-Parsing
// statt (anders als beim MCP-Tool "notion-update-page", das eingebettete
// "[Text](url)"-Syntax in echte Links umwandelt und dabei z. B. das führende
// "[" eines danebenliegenden JSON-Arrays verschluckt — deshalb müssen
// JSON-tragende Properties immer über diesen Weg geschrieben werden, nie
// über das MCP-Tool).
export function richTextValue(text) {
  return { rich_text: [{ text: { content: text ?? "" } }] };
}
export function checkboxValue(value) {
  return { checkbox: !!value };
}
export function selectValue(name) {
  return { select: name ? { name } : null };
}

// Notion ist die Single Source of Truth: nichts außer dem DB-Titel wird
// hier fest verdrahtet.
export async function getDataSourceByTitle(title) {
  const res = await notion.search({
    query: title,
    filter: { value: "data_source", property: "object" },
  });
  const dataSource = res.results.find(
    (r) =>
      r.object === "data_source" &&
      r.title?.map((t) => t.plain_text).join("").toLowerCase() === title.toLowerCase()
  );
  if (!dataSource) {
    throw new Error(
      `Keine Notion-Data-Source "${title}" gefunden. In Notion freigeben: DB öffnen → ••• → Verbindungen → Integration hinzufügen.`
    );
  }
  return dataSource;
}

export async function getRows(dataSourceId, filter) {
  const pages = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter,
      start_cursor: cursor ?? undefined,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return pages.filter((p) => "properties" in p);
}

export async function getPage(pageId) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  if (!("properties" in page)) throw new Error(`Notion-Seite ${pageId} nicht lesbar.`);
  return page;
}

export async function updatePageProperties(pageId, properties) {
  return notion.pages.update({ page_id: pageId, properties });
}

export async function createPage(dataSourceId, properties) {
  const page = await notion.pages.create({
    parent: { data_source_id: dataSourceId },
    properties,
  });
  if (!("properties" in page)) {
    throw new Error("Notion-Seite konnte nicht angelegt werden (Integration freigegeben?)");
  }
  return page;
}

export async function archivePage(pageId) {
  return notion.pages.update({ page_id: pageId, in_trash: true });
}
