# stl mail

Notion-gestützter Mail-Baukasten für Stadtteilliebe: Design-Komponenten und
inhaltliche Vorlagen leben als Daten in Notion, dieses Repo ist Editor +
Live-Vorschau + die eine Stelle, die daraus versandfertiges HTML macht
(auch für n8n).

Löst den bisherigen `email-builder.html` (lokale Datei, Vorlagen nur als
JS-Presets im Code, kein Zugriff für n8n) ab.

## Architektur

Zwei Notion-Datenquellen (unter der Seite "✉️ stl mail builder" in
Notion → Knowledge → Systems):

- **Mail Components** — ein Baustein-*Typ* pro Zeile (Überschrift,
  Fließtext, Button, Status-Label, stl Crew, plus die strukturellen
  Komponenten **Banner** und **Footer**). Pflegt nur das visuelle
  `<tr><td>`-HTML-Fragment (`Design HTML`) und welche Inhaltsfelder der
  Baustein hat (`Feldschema`, JSON). Wird selten geändert — nur wenn sich
  das Design eines Bausteintyps ändert.
- **Mail Templates** — eine konkrete Mail pro Zeile (z.B. "Neues Ticket",
  "Login"). Betreff, Banner an/aus + Variante, Footer an/aus, Status
  (Active/Draft), der `Webhook-Slug`, über den n8n die Vorlage anfragt,
  und `Blocks` — ein JSON-Array direkt auf der Vorlage, das referenziert,
  welche Components in welcher Reihenfolge mit welchem Inhalt verwendet
  werden: `[{ "componentId": "...", "enabled": true, "content": {...} }]`.
  Es gibt bewusst **keine** separate Bloecke-Tabelle — eine Vorlage
  referenziert ihre Components direkt.

Banner und Footer sind selbst ganz normale Mail Components (per Namen
gefunden), werden aber nicht über die `Blocks`-Liste ein-/ausgeschaltet,
sondern weiterhin über die eigenen Vorlagen-Schalter ("Banner aktiv"/
"Footer aktiv" + "Banner-Variante"), weil sie strukturell (immer oben/
unten) sind, nicht Teil der umsortierbaren Inhalts-Bausteine. Im
"+ Block"-Picker im Editor tauchen sie deshalb nicht auf.

Die bereits vorher bestehende, flache Vorlagen-Tabelle (für den
"Website Performance Radar"-Report) wurde in **Mail Reports** umbenannt,
um den Namen "Mail Templates" für die neue, komponentenbasierte Tabelle
frei zu machen — beide Tabellen sind sonst unverändert und unabhängig
voneinander.

**Zwei Platzhalter-Ebenen** (nicht verwechseln, siehe `lib/mail-render.js`):

- `[[feldname]]` in "Design HTML" — Komponenten-Platzhalter, wird beim
  Rendern aus dem `content` des jeweiligen Blocks aufgelöst.
- `{{TOKEN}}` in "Betreff"/`content`-Werten — Laufzeit-Platzhalter (z.B.
  `{{TICKET_URL}}`), bleibt in Notion stehen und wird erst beim
  tatsächlichen Versand mit echten Werten aus n8n ersetzt.

**Technische Hinweise:**

- `Feldschema` (Mail Components) und `Blocks` (Mail Templates) tragen
  JSON, aber mit einem `json:`-Präfix (`json:[{...}]`) — die Notion-API
  lehnt eine Text-Property ab, deren kompletter Wert sich direkt als
  JSON-Array/-Objekt parsen lässt. Der Präfix wird in `lib/notion.js`
  (`parseJsonProp`/`toJsonProp`) transparent gehandhabt.
- Schreibende Zugriffe **müssen** über `lib/notion.js`s
  `richTextValue`/`checkboxValue`/`selectValue`-Helfer laufen (siehe
  `lib/mail-templates.js`) — die Notion-REST-API akzeptiert nur
  vollständig typisierte Property-Objekte (`{ rich_text: [...] }` etc.),
  keine rohen Strings/Booleans. Zum Vergleich: die MCP-Notion-Tools bieten
  eine bequeme Kurzschreibweise mit rohen Werten an, aber auch einen
  eigenen Bug — `notion-update-page` interpretiert eingebettete
  `[Text](url)`-Mini-Syntax in `content`-Feldern als echten Markdown-Link
  und frisst dabei z.B. das führende `[` eines JSON-Arrays. Deshalb: JSON-
  tragende Properties nur über die App selbst (`@notionhq/client` direkt,
  kein Markdown-Parsing) schreiben, nie über das MCP-Tool von Hand.

## Seiten

- `/` — Liste aller Vorlagen.
- `/templates/[id]` — Editor: Vorlagen-Metadaten, Blockliste (Reihenfolge
  per ↑/↓, Aktiv-Schalter, Felder je nach Feldschema, Block hinzufügen/
  löschen), Live-Vorschau (iframe, Desktop/Tablet/Handy-Breiten) +
  Testdaten-Feld für Laufzeit-Tokens.
- `/components` — Komponenten verwalten (Design HTML + Feldschema), pro
  Komponente mit eigener Live-Vorschau samt Beispieldaten und
  Desktop/Tablet/Handy-Umschalter.
- `POST /api/render` — von n8n aufgerufen: `{ "slug": "neues-ticket",
  "tokens": { "contactName": "...", "ticketUrl": "..." } }` →
  `{ "subject": "...", "html": "..." }`. Dieselbe Rendering-Logik wie die
  Live-Vorschau (`lib/mail-render.js`), damit Vorschau und versendete Mail
  nie auseinanderlaufen.

## Setup

```bash
npm install
cp .env.local.example .env.local   # NOTION_TOKEN eintragen, falls nicht vorhanden
npm run dev
```

**Wichtig:** Die Notion-Integration hinter `NOTION_TOKEN` muss Zugriff auf
die beiden Datenquellen oben haben (in Notion: Seite/DB öffnen → ••• →
Verbindungen → Integration hinzufügen), sonst schlägt jede Abfrage mit
einem 404/"nicht gefunden" fehl.

## n8n-Integration (Ausblick)

Bestehende Workflows wie "Stadtteilliebe Inside - Neues Ticket
Benachrichtigung" senden Mails aktuell noch mit hart codiertem Text im
n8n-eigenen Send-Email-Node. Migration: HTTP-Request-Node vor den
Send-Email-Node, der `POST /api/render` mit `{slug, tokens}` aufruft und
`subject`/`html` in die Mail übernimmt — Annabell kann Inhalte dann in
Notion pflegen, ohne dass jemand den n8n-Workflow anfassen muss.
