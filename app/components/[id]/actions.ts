"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateComponent, deleteComponent } from "../../../lib/mail-templates";

export async function saveComponentAction(
  componentId: string,
  fields: { name?: string; designHtml?: string; description?: string; fieldSchema?: unknown; status?: string }
) {
  await updateComponent(componentId, fields);
  revalidatePath(`/components/${componentId}`);
  revalidatePath("/components");
}

export async function deleteComponentAction(componentId: string): Promise<{ error: string } | void> {
  try {
    // Prueft intern (deleteComponent -> findTemplatesUsingComponent), ob die
    // Komponente noch von einer Vorlage referenziert wird, und wirft dann
    // statt zu loeschen.
    await deleteComponent(componentId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/components");
  redirect("/components");
}
