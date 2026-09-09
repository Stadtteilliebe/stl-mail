"use server";

import { revalidatePath } from "next/cache";
import { getTemplateById, updateTemplateBlocks, updateTemplateMeta, getComponentById } from "../../../lib/mail-templates";

// Blöcke leben als ein JSON-Array direkt auf der Vorlage (Property
// "Blocks") — jede Änderung liest das aktuelle Array, mutiert es in JS und
// schreibt es komplett zurück. Adressierung über den Array-Index, nicht
// über eine eigene Block-ID (die gibt es seit dem Wegfall der separaten
// Bloecke-Tabelle "Mail Pattern" nicht mehr).

export async function saveBlockContentAction(templateId: string, index: number, content: Record<string, unknown>) {
  const template = await getTemplateById(templateId);
  const blocks = [...template.blocks];
  if (!blocks[index]) return;
  blocks[index] = { ...blocks[index], content };
  await updateTemplateBlocks(templateId, blocks);
  revalidatePath(`/templates/${templateId}`);
}

export async function toggleBlockEnabledAction(templateId: string, index: number, enabled: boolean) {
  const template = await getTemplateById(templateId);
  const blocks = [...template.blocks];
  if (!blocks[index]) return;
  blocks[index] = { ...blocks[index], enabled };
  await updateTemplateBlocks(templateId, blocks);
  revalidatePath(`/templates/${templateId}`);
}

export async function saveTemplateMetaAction(
  templateId: string,
  fields: { subject?: string; footerEnabled?: boolean }
) {
  await updateTemplateMeta(templateId, fields);
  revalidatePath(`/templates/${templateId}`);
}

// Reihenfolge per Tausch mit dem Nachbarn — reicht für die kleinen
// Blocklisten dieses Tools (typischerweise 3-8 Blöcke pro Vorlage), spart
// Drag&Drop-Aufwand für v1.
export async function moveBlockAction(templateId: string, index: number, direction: "up" | "down") {
  const template = await getTemplateById(templateId);
  const blocks = [...template.blocks];
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= blocks.length) return;
  [blocks[index], blocks[swapIndex]] = [blocks[swapIndex], blocks[index]];
  await updateTemplateBlocks(templateId, blocks);
  revalidatePath(`/templates/${templateId}`);
}

export async function addBlockAction(templateId: string, componentId: string) {
  const [template, component] = await Promise.all([getTemplateById(templateId), getComponentById(componentId)]);

  const defaultContent: Record<string, unknown> = {};
  for (const field of component.fieldSchema) {
    if (field.type === "badges") defaultContent[field.key] = [];
    else if (field.type === "select") defaultContent[field.key] = field.options?.[0] ?? "";
    else defaultContent[field.key] = "";
  }

  const blocks = [...template.blocks, { componentId, enabled: true, content: defaultContent }];
  await updateTemplateBlocks(templateId, blocks);
  revalidatePath(`/templates/${templateId}`);
}

export async function removeBlockAction(templateId: string, index: number) {
  const template = await getTemplateById(templateId);
  const blocks = template.blocks.filter((_: unknown, i: number) => i !== index);
  await updateTemplateBlocks(templateId, blocks);
  revalidatePath(`/templates/${templateId}`);
}
