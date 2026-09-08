// Reiner Rendering-Code ohne Notion-/Node-Abhängigkeiten — bewusst so
// gehalten, damit dieses Modul sowohl im Server (Vorschau, /api/render für
// n8n) als auch im Browser (Live-Vorschau im Editor) unverändert läuft.
//
// Zwei getrennte Platzhalter-Ebenen, die nicht verwechselt werden dürfen:
//   [[feldname]]   – Komponenten-Platzhalter, kommt aus Mail Components
//                    "Design HTML" und wird HIER anhand des Feldschemas und
//                    der Block-"Inhalt"-Werte aufgelöst (einmalig pro Block).
//   {{TOKEN}}       – Laufzeit-Platzhalter, bleibt bis zum Versand in Notion
//                     als Text stehen (z.B. in "Inhalt": "{{TICKET_URL}}")
//                     und wird erst von substituteRuntimeTokens() mit den
//                     tatsächlichen Werten aus dem n8n-Webhook ersetzt.
// {{FONT_STACK}} ist ein Sonderfall: ein fester, nicht editierbarer
// Struktur-Platzhalter (kein Feld, kein Laufzeit-Token), der immer auf denselben
// Font-Stack zeigt.

export const FONT_STACK =
  "'Averta Std',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Mini-Syntax aus dem alten email-builder.html: **fett**, [Text](url),
// Zeilenumbrueche. {{TOKEN}} bleibt unveraendert stehen (kein Escaping der
// geschweiften Klammern noetig, escapeHtml fasst sie nicht an).
export function parseInlineText(raw) {
  let s = escapeHtml(raw);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#000000; text-decoration:underline;">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:600;">$1</strong>');
  s = s.replace(/\n/g, "<br>");
  return s;
}

function renderBadges(badges) {
  const list = Array.isArray(badges) ? badges : [];
  return list
    .map((bd, i) => {
      const badge = `<span style="display:inline-block; white-space:nowrap; margin:4px 0;"><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${escapeHtml(bd.color)}; margin-right:8px; vertical-align:middle;">&nbsp;</span><span style="vertical-align:middle;">${escapeHtml(bd.text)}</span></span>`;
      const arrow =
        i < list.length - 1
          ? ` <span style="display:inline-block; margin:0 6px; vertical-align:middle;">&rarr;</span> `
          : "";
      return badge + arrow;
    })
    .join("");
}

// Loest die [[feldname]]-Platzhalter im Design HTML einer Komponente anhand
// der Feldwerte eines konkreten Blocks auf. "topPad" ist der einzige
// strukturelle Wert, der nicht aus dem Feldschema kommt, sondern aus der
// Position des Blocks in der Vorlage (erster Block bzw. Crew-Baustein haben
// mehr Abstand nach oben, exakt wie im alten email-builder.html).
export function renderBlock(component, content, topPad) {
  let html = component.designHtml;
  html = html.replaceAll("[[topPad]]", String(topPad));

  for (const field of component.fieldSchema) {
    const value = content?.[field.key];
    let resolved = "";
    if (field.type === "richtext") {
      resolved = parseInlineText(value || "");
    } else if (field.type === "select" && field.key === "weight") {
      resolved = value === "semibold" ? "600" : "400";
    } else if (field.type === "badges") {
      resolved = renderBadges(value);
    } else if (field.type === "url") {
      resolved = escapeHtml(value || "#");
    } else {
      resolved = escapeHtml(value || "");
    }
    html = html.replaceAll(`[[${field.key}]]`, resolved);
    if (field.key === "weight") html = html.replaceAll("[[weightCss]]", resolved);
  }
  if (component.fieldSchema.some((f) => f.type === "badges")) {
    html = html.replaceAll("[[badgesHtml]]", renderBadges(content?.badges));
  }

  return html;
}

// Ersetzt {{TOKEN}}-Laufzeit-Platzhalter in einem beliebigen String (Betreff
// oder fertiges HTML) mit konkreten Werten, z.B. {contactName: "Hannes"}.
// Unbekannte Tokens bleiben bewusst stehen statt zu "" zu werden — ein
// fehlender Token soll beim Testen auffallen, nicht stillschweigend
// verschwinden.
const TOKEN_MAP = {
  CONTACT_NAME: "contactName",
  TICKET_TITEL: "title",
  TICKET_URL: "ticketUrl",
  TICKET_NUMMER: "ticketNumber",
  PROJEKT_NAME: "projectName",
  LOGIN_URL: "loginUrl",
  NAME: "name",
};

export function substituteRuntimeTokens(text, tokens) {
  return String(text ?? "").replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    const dataKey = TOKEN_MAP[key];
    const value = dataKey ? tokens?.[dataKey] : tokens?.[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

function bannerImageFor(variant) {
  return variant === "dark" ? "assets/header-banner-dark.png" : "assets/header-banner.png";
}

// Baut den kompletten Mail-HTML-Body (ohne <head>/<style>-Wrapper) aus
// Vorlage + aufgeloesten Bloecken. Banner und Footer sind selbst ganz
// normale Mail Components ("Banner"/"Footer" — per Namen gefunden), nur
// werden sie nicht ueber die Bloecke-Liste ein-/ausgeschaltet, sondern
// weiterhin ueber die eigenen Vorlagen-Schalter ("Banner aktiv"/"Footer
// aktiv"), weil sie strukturell (immer oben/unten) und nicht Teil der
// umsortierbaren Bloecke sind. Der reine Dokument-Wrapper (Fonts, Media-
// Queries, Outlook-Fallbacks) bleibt konstant und kein Notion-Inhalt.
export function buildEmailBody(template, resolvedBlocks, components) {
  const enabledBlocks = resolvedBlocks.filter((b) => b.enabled && b.component);
  const bannerComponent = components?.find((c) => c.name === "Banner");
  const footerComponent = components?.find((c) => c.name === "Footer");

  const bannerHTML =
    template.bannerEnabled && bannerComponent
      ? renderBlock(bannerComponent, { bannerImage: bannerImageFor(template.bannerVariant) }, 0)
      : "";

  let rows = "";
  enabledBlocks.forEach((b, i) => {
    const topPad = i === 0 ? 40 : b.component.name === "stl Crew (PNG)" ? 32 : 24;
    rows += renderBlock(b.component, b.content, topPad);
  });

  const dividerHTML =
    template.footerEnabled && enabledBlocks.length
      ? `
      <tr>
        <td class="px" style="padding:32px 40px 0 40px;">
          <div style="border-top:1px solid #000000; font-size:0; line-height:0;">&nbsp;</div>
        </td>
      </tr>`
      : "";

  const footerHTML =
    template.footerEnabled && footerComponent ? renderBlock(footerComponent, {}, 0) : "";

  let body = `${bannerHTML}
  <!--[if mso]>
  <table role="presentation" width="1000" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
  <![endif]-->
  <div class="container" style="max-width:1000px; margin:0 auto;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:1000px; border-collapse:collapse;">
${rows}${dividerHTML}${footerHTML}
    </table>
  </div>
  <!--[if mso]></td></tr></table><![endif]-->`;

  body = body.replaceAll("{{FONT_STACK}}", FONT_STACK);
  return body;
}

// Kompletter, versandfertiger HTML-Dokument-Wrapper (head/style/Outlook-
// Fallbacks) — identisch zum bisherigen email-builder.html, damit sich am
// Rendering-Verhalten in Mail-Clients nichts aendert.
export function wrapEmailDocument(body) {
  return `<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>stadtteilliebe</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  @font-face { font-family: 'Averta Std'; src: url('assets/fonts/AvertaStd-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Averta Std'; src: url('assets/fonts/AvertaStd-Semibold.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #ffffff; }
  .email-body { font-family: ${FONT_STACK}; }
  .heading { font-family: ${FONT_STACK}; font-weight: 600; }
  .heading, .fliesstext, .footer-text, .cta-btn { word-break: break-word; overflow-wrap: break-word; }
  .px { max-width: 100%; }
  .hover-link { text-decoration: none; }
  .hover-link:hover { text-decoration: underline; }
  @media screen and (max-width: 600px) {
    .fliesstext { font-size: 14px !important; }
    .footer-text { font-size: 14px !important; }
    .cta-btn { font-size: 14px !important; padding: 12px 24px !important; }
    .heading { font-size: 44px !important; line-height: 1.15 !important; }
    .crew-img { height: 20px !important; }
    .social-icon { width: 26px !important; height: 26px !important; }
    .footer-gap-a { display: none !important; }
    .footer-gap-b { padding-right: 20px !important; }
  }
  @media screen and (max-width: 950px) {
    .footer-col { display: block !important; width: 100% !important; text-align: left !important; }
    .footer-social { display: block !important; width: 100% !important; text-align: left !important; margin-top: 24px !important; }
    .footer-social table { margin-left: 0 !important; }
  }
  @media screen and (max-width: 480px) {
    .container { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
  }
  .full-bleed { width: 100% !important; }
</style>
</head>
<body class="email-body" style="margin:0; padding:0; background-color:#ffffff;">
${body}
</body>
</html>
`;
}

// Baut Vorschau-HTML (mit noch offenen {{TOKEN}}-Platzhaltern, gut lesbar
// im Editor) oder versandfertiges HTML (wenn runtimeTokens uebergeben wird).
// "components" ist die volle Mail-Components-Liste — daraus werden neben
// den referenzierten Block-Komponenten auch "Banner" und "Footer" gezogen.
export function renderTemplate(template, resolvedBlocks, components, runtimeTokens) {
  let body = buildEmailBody(template, resolvedBlocks, components);
  let subject = template.subject;
  if (runtimeTokens) {
    body = substituteRuntimeTokens(body, runtimeTokens);
    subject = substituteRuntimeTokens(subject, runtimeTokens);
  }
  return { subject, html: wrapEmailDocument(body) };
}

// Plausible Beispielwerte je Feldtyp, nur fuer die isolierte
// Komponenten-Vorschau auf /components — dort gibt es keine echte
// Verwendung mit echtem Inhalt, aus der man vorschauen koennte.
export function sampleContentForComponent(component) {
  const content = {};
  for (const field of component.fieldSchema) {
    if (field.type === "richtext") {
      content[field.key] = "Beispieltext mit **Fett** und einem [Link](https://stadtteilliebe.de).";
    } else if (field.type === "select") {
      content[field.key] = field.options?.[0] ?? "";
    } else if (field.type === "badges") {
      content[field.key] = [
        { text: "In Progress", color: "#00B7EB" },
        { text: "Ready", color: "#9B5DE5" },
      ];
    } else if (field.type === "url") {
      content[field.key] = "https://stadtteilliebe.de";
    } else {
      content[field.key] = field.label || "Beispieltext";
    }
  }
  return content;
}

// Isolierte Vorschau eines einzelnen Bausteins (ohne Banner/Footer) — nutzt
// dieselbe buildEmailBody()-Pipeline wie eine echte Vorlage, nur mit genau
// einem Block, damit sich das Design einer Komponente nicht auseinander-
// entwickeln kann von dem, was in einer echten Mail tatsaechlich passiert.
export function renderComponentPreview(component, content) {
  const fakeTemplate = { bannerEnabled: false, bannerVariant: "light", footerEnabled: false };
  const resolvedBlocks = [{ enabled: true, component, content }];
  const body = buildEmailBody(fakeTemplate, resolvedBlocks);
  return wrapEmailDocument(body);
}
