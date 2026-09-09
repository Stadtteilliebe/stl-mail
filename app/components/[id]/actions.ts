"use server";

import { revalidatePath } from "next/cache";
import { updateComponent } from "../../../lib/mail-templates";

export async function saveComponentAction(
  componentId: string,
  fields: { designHtml?: string; description?: string; fieldSchema?: unknown }
) {
  await updateComponent(componentId, fields);
  revalidatePath(`/components/${componentId}`);
}
