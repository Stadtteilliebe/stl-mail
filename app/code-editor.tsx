"use client";

import type { CSSProperties } from "react";

// Handgerollter Syntax-Highlighter statt einer Editor-Library (Prism,
// CodeMirror, @uiw/react-textarea-code-editor, ...) — nur zwei Sprachen
// (HTML-Fragmente, JSON) und ein Sonderfall (die [[..]]/{{..}}-Platzhalter-
// Syntax dieses Projekts), dafür lohnt sich kein zusätzliches Abhängigkeits-
// gewicht. Gleiche Präferenz für minimale Dependencies wie beim
// handgerollten Session-Token in lib/session.js statt einer JWT-Library.
//
// Klassisches "Textarea + synchronisiertes <pre> darunter"-Muster: beide
// liegen per CSS-Grid in derselben Zelle übereinander (kein manuelles
// Scroll-Sync-Gefrickel mit position:absolute nötig, der Grid-Trick
// funktioniert auch für die Scrollbar der Wrapper-Box). Die Textarea ist
// unsichtbar eingefärbt (Text transparent, nur der Cursor sichtbar) und
// liegt im DOM zuletzt, damit sie Tipp-/Auswahl-Interaktion bekommt; das
// <pre> darunter zeigt die farbige Version durch.

type Token = { type: string; text: string };

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tokenize(text: string, rules: { type: string; regex: RegExp }[]): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const rule of rules) {
      rule.regex.lastIndex = i;
      const m = rule.regex.exec(text);
      if (m && m.index === i && m[0].length > 0) {
        tokens.push({ type: rule.type, text: m[0] });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const last = tokens[tokens.length - 1];
      if (last?.type === "plain") last.text += text[i];
      else tokens.push({ type: "plain", text: text[i] });
      i += 1;
    }
  }
  return tokens;
}

// Reihenfolge = Prioritaet: an jeder Position gewinnt die erste passende
// Regel. "y" (sticky) bindet das Match an genau die aktuelle Position
// (kein Suchen weiter hinten im String).
const HTML_RULES = [
  { type: "placeholder", regex: /\{\{[^}]*\}\}|\[\[[^\]]*\]\]/y },
  { type: "tag", regex: /<\/?[a-zA-Z][\w-]*/y },
  { type: "string", regex: /"[^"]*"|'[^']*'/y },
  { type: "attr", regex: /[a-zA-Z-]+(?==)/y },
  { type: "punct", regex: /\/?>/y },
];

const JSON_RULES = [
  { type: "key", regex: /"(?:[^"\\]|\\.)*"(?=\s*:)/y },
  { type: "string", regex: /"(?:[^"\\]|\\.)*"/y },
  { type: "number", regex: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y },
  { type: "boolean", regex: /\btrue\b|\bfalse\b|\bnull\b/y },
  { type: "punct", regex: /[{}[\],:]/y },
];

const COLORS: Record<string, string> = {
  tag: "#f472b6",
  attr: "#7dd3fc",
  string: "#4ade80",
  key: "#7dd3fc",
  number: "#fb923c",
  boolean: "#c084fc",
  punct: "#a1a1aa",
  // Platzhalter sind das Wichtigste beim Bearbeiten (steuern, was beim
  // Rendern ersetzt wird) — bekommen deshalb die auffälligste Farbe plus
  // Fettung statt sich in generischem Syntax-Coloring zu verstecken.
  placeholder: "#fbbf24",
  plain: "#e4e4e7",
};

function highlight(text: string, language: "html" | "json") {
  const rules = language === "html" ? HTML_RULES : JSON_RULES;
  return tokenize(text, rules)
    .map((t) => {
      const color = COLORS[t.type] ?? COLORS.plain;
      const weight = t.type === "placeholder" ? "font-weight:600;" : "";
      return `<span style="color:${color};${weight}">${escapeHtml(t.text)}</span>`;
    })
    .join("");
}

export function CodeEditor({
  value,
  onChange,
  language,
  minHeight = 160,
  maxHeight = 420,
}: {
  value: string;
  onChange: (value: string) => void;
  language: "html" | "json";
  minHeight?: number;
  maxHeight?: number;
}) {
  const html = highlight(value, language) + "\n";
  const shared: CSSProperties = {
    gridArea: "1 / 1",
    width: "100%",
    margin: 0,
    padding: 10,
    boxSizing: "border-box",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    tabSize: 2,
  };

  return (
    <div
      className="rounded-lg border border-black/[.08] dark:border-white/[.145]"
      style={{ display: "grid", minHeight, maxHeight, overflow: "auto", background: "#1e1e2e" }}
    >
      <pre
        aria-hidden
        style={{ ...shared, color: COLORS.plain, pointerEvents: "none" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        style={{
          ...shared,
          color: "transparent",
          caretColor: "#ffffff",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
        }}
      />
    </div>
  );
}
