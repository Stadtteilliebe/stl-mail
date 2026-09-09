"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { CodeEditor } from "../../code-editor";
import { saveComponentAction, deleteComponentAction } from "./actions";
import { renderComponentPreview, sampleContentForComponent } from "../../../lib/mail-render";
import { WidthToggle, PREVIEW_WIDTHS, type PreviewWidthKey } from "../../width-toggle";
import { FullscreenHeader } from "../../fullscreen-header";

type FieldSchema = { key: string; label: string; type: string; options?: string[] };
type Component = {
  id: string;
  name: string;
  description: string;
  designHtml: string;
  fieldSchema: FieldSchema[];
  status: string;
};

// Header (inkl. Speichern-Button) lebt hier statt in page.tsx, weil der
// Button den Client-seitigen Dirty-/Speicher-Status braucht — ein Server
// Component drumherum könnte den nicht kennen.
export function ComponentEditor({ component }: { component: Component }) {
  const [name, setName] = useState(component.name);
  const [description, setDescription] = useState(component.description);
  const [designHtml, setDesignHtml] = useState(component.designHtml);
  const [fieldSchemaText, setFieldSchemaText] = useState(JSON.stringify(component.fieldSchema, null, 2));
  const [active, setActive] = useState(component.status === "Active");
  const [previewWidth, setPreviewWidth] = useState<PreviewWidthKey>("desktop");
  const [fieldSchemaError, setFieldSchemaError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const widthPx = PREVIEW_WIDTHS.find((w) => w.key === previewWidth)!.px;

  // Letzter gespeicherter Stand — Vergleich dagegen entscheidet, ob der
  // Speichern-Button auftaucht ("wenn Änderungen vorgenommen").
  const saved = useRef({ name, description, designHtml, fieldSchemaText, active });
  const isDirty =
    name !== saved.current.name ||
    description !== saved.current.description ||
    designHtml !== saved.current.designHtml ||
    fieldSchemaText !== saved.current.fieldSchemaText ||
    active !== saved.current.active;

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
      setFieldSchemaError(null);
    } catch {
      setFieldSchemaError("Feldschema ist kein gültiges JSON — nicht gespeichert.");
      return;
    }
    startTransition(async () => {
      await saveComponentAction(component.id, {
        name,
        description,
        designHtml,
        fieldSchema,
        status: active ? "Active" : "Draft",
      });
      saved.current = { name, description, designHtml, fieldSchemaText, active };
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteComponentAction(component.id);
      if (result?.error) {
        setDeleteError(result.error);
        setConfirmingDelete(false);
      }
      // Kein "else": bei Erfolg leitet deleteComponentAction per redirect()
      // schon zu /components weiter, hier gibt es dann nichts mehr zu tun.
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <FullscreenHeader
        title={name || "Ohne Namen"}
        backHref="/components"
        backLabel="Alle Komponenten"
        actions={
          <>
            {justSaved && !isDirty && (
              <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                ✓ Gespeichert
              </span>
            )}
            {(isDirty || isPending) && (
              <button
                onClick={save}
                disabled={isPending}
                className="text-sm px-3 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
              >
                {isPending ? "Speichert…" : "Speichern"}
              </button>
            )}
          </>
        }
      />

      <main className="flex-1 min-h-0 flex">
        <div className="w-[440px] min-w-[440px] border-r border-black/[.08] dark:border-white/[.145] overflow-y-auto p-5 space-y-5">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Name</label>
              <input
                className="w-full text-sm border border-black/[.08] dark:border-white/[.145] rounded-md px-2 py-1.5 bg-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span className="text-sm">{active ? "Active" : "Not Active"}</span>
            </div>

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
              <CodeEditor
                value={designHtml}
                language="html"
                onChange={setDesignHtml}
                minHeight={220}
                maxHeight={340}
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Feldschema (JSON)</label>
              <CodeEditor
                value={fieldSchemaText}
                language="json"
                onChange={setFieldSchemaText}
                minHeight={160}
                maxHeight={280}
              />
              {fieldSchemaError && <p className="text-xs text-red-500 mt-1">{fieldSchemaError}</p>}
            </div>
          </div>

          <div className="border border-red-200 dark:border-red-900/60 rounded-lg p-4 space-y-2 bg-red-50/50 dark:bg-red-950/20">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Löscht diese Komponente unwiderruflich. Nicht möglich, solange sie noch in einer
              Vorlage verwendet wird.
            </p>
            {deleteError && <p className="text-xs text-red-600 dark:text-red-400">{deleteError}</p>}
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-sm px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Komponente löschen
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? "Löscht…" : "Wirklich löschen"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sm px-3 py-1.5 rounded-md border border-black/[.08] dark:border-white/[.145]"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-6 py-3 border-b border-black/[.08] dark:border-white/[.145] flex items-center justify-center">
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
      </main>
    </div>
  );
}
