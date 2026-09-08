"use client";

import { useMemo, useState, useTransition } from "react";
import { renderTemplate } from "../../../lib/mail-render";
import { WidthToggle, PREVIEW_WIDTHS, type PreviewWidthKey } from "../../width-toggle";
import {
  saveBlockContentAction,
  toggleBlockEnabledAction,
  saveTemplateMetaAction,
  moveBlockAction,
  addBlockAction,
  removeBlockAction,
} from "./actions";

type FieldSchema = { key: string; label: string; type: string; options?: string[] };
type Component = {
  id: string;
  name: string;
  description: string;
  designHtml: string;
  fieldSchema: FieldSchema[];
  status: string;
};
type Block = {
  componentId: string | null;
  enabled: boolean;
  content: Record<string, unknown>;
  component: Component | null;
};
type Template = {
  id: string;
  name: string;
  slug: string;
  subject: string;
  bannerEnabled: boolean;
  bannerVariant: string;
  footerEnabled: boolean;
  status: string;
};

const DEFAULT_TOKENS = `{
  "contactName": "Max Mustermann",
  "title": "Beispiel-Ticket",
  "ticketUrl": "https://inside.stadtteilliebe.de/tickets/beispiel",
  "projectName": "Beispiel-Projekt",
  "loginUrl": "https://inside.stadtteilliebe.de/auth/verify?token=beispiel"
}`;

export function TemplateEditor({
  template,
  initialBlocks,
  components,
  allComponents,
}: {
  template: Template;
  initialBlocks: Block[];
  components: Component[];
  allComponents: Component[];
}) {
  const [meta, setMeta] = useState(template);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [tokensText, setTokensText] = useState(DEFAULT_TOKENS);
  const [addComponentId, setAddComponentId] = useState(components[0]?.id ?? "");
  const [previewWidth, setPreviewWidth] = useState<PreviewWidthKey>("desktop");
  const [isPending, startTransition] = useTransition();
  const widthPx = PREVIEW_WIDTHS.find((w) => w.key === previewWidth)!.px;

  const tokens = useMemo(() => {
    try {
      return JSON.parse(tokensText);
    } catch {
      return {};
    }
  }, [tokensText]);

  const { subject, html } = useMemo(() => {
    try {
      return renderTemplate(meta, blocks, allComponents, tokens);
    } catch (e) {
      return { subject: "", html: `<pre>${(e as Error).message}</pre>` };
    }
  }, [meta, blocks, allComponents, tokens]);

  function updateBlockContentLocal(index: number, key: string, value: unknown) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, content: { ...b.content, [key]: value } } : b))
    );
  }

  function persistBlockContent(index: number, block: Block) {
    startTransition(() => {
      saveBlockContentAction(meta.id, index, block.content);
    });
  }

  function toggleEnabled(index: number, block: Block) {
    const next = !block.enabled;
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, enabled: next } : b)));
    startTransition(() => {
      toggleBlockEnabledAction(meta.id, index, next);
    });
  }

  function saveMeta(fields: Partial<Template>) {
    const next = { ...meta, ...fields };
    setMeta(next);
    startTransition(() => {
      saveTemplateMetaAction(meta.id, fields);
    });
  }

  function move(index: number, direction: "up" | "down") {
    startTransition(() => {
      moveBlockAction(meta.id, index, direction).then(() => window.location.reload());
    });
  }

  function addBlock() {
    if (!addComponentId) return;
    startTransition(() => {
      addBlockAction(meta.id, addComponentId).then(() => window.location.reload());
    });
  }

  function removeBlock(index: number, block: Block) {
    if (!confirm(`Block "${block.component?.name ?? ""}" wirklich löschen?`)) return;
    startTransition(() => {
      removeBlockAction(meta.id, index).then(() => window.location.reload());
    });
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-[440px] min-w-[440px] border-r border-black/[.08] dark:border-white/[.145] overflow-y-auto p-5 space-y-5">
        <section className="border border-black/[.08] dark:border-white/[.145] rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Vorlage
          </h2>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400">Betreff</label>
          <input
            className="w-full text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
            defaultValue={meta.subject}
            onBlur={(e) => saveMeta({ subject: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={meta.bannerEnabled}
              onChange={(e) => saveMeta({ bannerEnabled: e.target.checked })}
            />
            <span className="text-sm flex-1">Banner</span>
            <select
              className="text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-1.5 py-1 bg-transparent"
              value={meta.bannerVariant}
              onChange={(e) => saveMeta({ bannerVariant: e.target.value })}
            >
              <option value="light">Helles Lila</option>
              <option value="dark">Schwarz</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={meta.footerEnabled}
              onChange={(e) => saveMeta({ footerEnabled: e.target.checked })}
            />
            <span className="text-sm">Footer</span>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Blöcke
          </h2>
          {blocks.map((block, i) => (
            <BlockCard
              key={i}
              block={block}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
              onFieldChange={(key, value) => updateBlockContentLocal(i, key, value)}
              onFieldBlur={() => persistBlockContent(i, block)}
              onToggleEnabled={() => toggleEnabled(i, block)}
              onMoveUp={() => move(i, "up")}
              onMoveDown={() => move(i, "down")}
              onRemove={() => removeBlock(i, block)}
            />
          ))}

          <div className="flex gap-2 pt-2">
            <select
              className="flex-1 text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
              value={addComponentId}
              onChange={(e) => setAddComponentId(e.target.value)}
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="text-sm px-3 py-1.5 rounded-md border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.03] dark:hover:bg-white/[.06]"
              onClick={addBlock}
              disabled={isPending}
            >
              + Block
            </button>
          </div>
        </section>

        <section className="border border-black/[.08] dark:border-white/[.145] rounded-lg p-4 bg-white dark:bg-zinc-950 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Test-Daten (Laufzeit-Tokens)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Simuliert die Werte, die n8n beim echten Versand einsetzt.
          </p>
          <textarea
            className="w-full h-40 text-xs font-mono border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
            value={tokensText}
            onChange={(e) => setTokensText(e.target.value)}
          />
        </section>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-6 py-3 border-b border-black/[.08] dark:border-white/[.145] flex items-center justify-between gap-4">
          <div className="text-sm min-w-0">
            <span className="text-zinc-500 dark:text-zinc-400">Betreff: </span>
            <span className="font-medium">{subject}</span>
          </div>
          <WidthToggle value={previewWidth} onChange={setPreviewWidth} />
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-6 flex justify-center bg-zinc-100 dark:bg-zinc-900">
          <iframe
            className="bg-white shadow-sm border border-black/[.08] transition-[width] duration-150"
            style={{ minHeight: "800px", width: widthPx, maxWidth: "100%" }}
            srcDoc={html}
          />
        </div>
      </div>
    </div>
  );
}

function BlockCard({
  block,
  isFirst,
  isLast,
  onFieldChange,
  onFieldBlur,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onFieldChange: (key: string, value: unknown) => void;
  onFieldBlur: () => void;
  onToggleEnabled: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const component = block.component;

  return (
    <div className="border border-black/[.08] dark:border-white/[.145] rounded-lg bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900">
        <button
          className="text-xs text-zinc-400 disabled:opacity-30"
          onClick={onMoveUp}
          disabled={isFirst}
          title="Nach oben"
        >
          ↑
        </button>
        <button
          className="text-xs text-zinc-400 disabled:opacity-30"
          onClick={onMoveDown}
          disabled={isLast}
          title="Nach unten"
        >
          ↓
        </button>
        <span
          className="text-sm font-medium flex-1 cursor-pointer"
          onClick={() => setOpen((o) => !o)}
        >
          {component?.name ?? "Unbekannte Komponente"}
        </span>
        <input type="checkbox" checked={block.enabled} onChange={onToggleEnabled} title="Aktiv" />
        <button className="text-xs text-zinc-400" onClick={() => setOpen((o) => !o)}>
          {open ? "▴" : "▾"}
        </button>
        <button className="text-xs text-red-500" onClick={onRemove} title="Löschen">
          🗑
        </button>
      </div>
      {open && component && (
        <div className="p-3 space-y-3">
          {component.fieldSchema.length === 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Diese Komponente hat keine Inhaltsfelder.
            </p>
          )}
          {component.fieldSchema.map((field) => (
            <FieldEditor
              key={field.key}
              field={field}
              value={block.content?.[field.key]}
              onChange={(v) => onFieldChange(field.key, v)}
              onBlur={onFieldBlur}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: FieldSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
}) {
  if (field.type === "richtext") {
    return (
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{field.label}</label>
        <textarea
          className="w-full h-24 text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
          defaultValue={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <p className="text-[11px] text-zinc-400 mt-1">
          **fett**, [Linktext](url), {"{{TOKEN}}"} bleibt als Platzhalter erhalten.
        </p>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{field.label}</label>
        <select
          className="w-full text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
          value={String(value ?? field.options?.[0] ?? "")}
          onChange={(e) => {
            onChange(e.target.value);
            onBlur();
          }}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "badges") {
    const badges = Array.isArray(value) ? value : [];
    return (
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{field.label}</label>
        <textarea
          className="w-full h-20 text-xs font-mono border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
          defaultValue={JSON.stringify(badges, null, 0)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              /* ungültiges JSON — Wert erst bei Korrektur übernehmen */
            }
          }}
          onBlur={onBlur}
        />
        <p className="text-[11px] text-zinc-400 mt-1">
          JSON-Array, z.B. [{"{"}"text":"Ready","color":"#9B5DE5"{"}"}]
        </p>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{field.label}</label>
      <input
        className="w-full text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
        defaultValue={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}
