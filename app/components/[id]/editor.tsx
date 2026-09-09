"use client";

import { useMemo, useState, useTransition } from "react";
import { saveComponentAction } from "./actions";
import { renderComponentPreview, sampleContentForComponent } from "../../../lib/mail-render";
import { WidthToggle, PREVIEW_WIDTHS, type PreviewWidthKey } from "../../width-toggle";

type FieldSchema = { key: string; label: string; type: string; options?: string[] };
type Component = {
  id: string;
  name: string;
  description: string;
  designHtml: string;
  fieldSchema: FieldSchema[];
  status: string;
};

// Gleicher Zuschnitt wie app/templates/[id]/editor.tsx (440px-Formularspalte
// links, Vorschau rechts) — beide Detailseiten sollen sich gleich anfühlen.
export function ComponentEditor({ component }: { component: Component }) {
  const [designHtml, setDesignHtml] = useState(component.designHtml);
  const [description, setDescription] = useState(component.description);
  const [fieldSchemaText, setFieldSchemaText] = useState(JSON.stringify(component.fieldSchema, null, 2));
  const [previewWidth, setPreviewWidth] = useState<PreviewWidthKey>("desktop");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const widthPx = PREVIEW_WIDTHS.find((w) => w.key === previewWidth)!.px;

  // Solange das Feldschema-JSON beim Tippen ungültig ist, mit dem zuletzt
  // gültigen Schema weiterrendern statt die Vorschau abstürzen zu lassen.
  const parsedFieldSchema = useMemo(() => {
    try {
      return JSON.parse(fieldSchemaText);
    } catch {
      return component.fieldSchema;
    }
  }, [fieldSchemaText, component.fieldSchema]);

  const previewHtml = useMemo(() => {
    const previewComponent = { ...component, designHtml, fieldSchema: parsedFieldSchema };
    try {
      return renderComponentPreview(previewComponent, sampleContentForComponent(previewComponent));
    } catch (e) {
      return `<pre>${(e as Error).message}</pre>`;
    }
  }, [component, designHtml, parsedFieldSchema]);

  function save() {
    let fieldSchema;
    try {
      fieldSchema = JSON.parse(fieldSchemaText);
      setError(null);
    } catch {
      setError("Feldschema ist kein gültiges JSON — nicht gespeichert.");
      return;
    }
    startTransition(() => {
      saveComponentAction(component.id, { designHtml, description, fieldSchema });
    });
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-[440px] min-w-[440px] border-r border-black/[.08] dark:border-white/[.145] overflow-y-auto p-5 space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Beschreibung</label>
          <input
            className="w-full text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Design HTML ({"<tr><td>"}-Fragment, [[feld]] als Platzhalter)
          </label>
          <textarea
            className="w-full h-56 text-xs font-mono border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
            value={designHtml}
            onChange={(e) => setDesignHtml(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Feldschema (JSON)</label>
          <textarea
            className="w-full h-40 text-xs font-mono border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
            value={fieldSchemaText}
            onChange={(e) => setFieldSchemaText(e.target.value)}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          className="text-sm px-3 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
          onClick={save}
          disabled={isPending}
        >
          {isPending ? "Speichert…" : "Speichern"}
        </button>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-6 py-3 border-b border-black/[.08] dark:border-white/[.145] flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Vorschau mit Beispieldaten</span>
          <WidthToggle value={previewWidth} onChange={setPreviewWidth} />
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-6 flex justify-center bg-zinc-100 dark:bg-zinc-900">
          <iframe
            className="bg-white shadow-sm border border-black/[.08] transition-[width] duration-150"
            style={{ minHeight: "400px", width: widthPx, maxWidth: "100%" }}
            srcDoc={previewHtml}
          />
        </div>
      </div>
    </div>
  );
}
