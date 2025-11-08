"use server";

import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { parseCharacterFormData, insertCharacterRecord, updateCharacterRecord } from "@/lib/services/characters";
import { ActionResult } from "@/lib/types/api";
import { formatZodErrors } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCharacter(
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = parseCharacterFormData(formData);

  if (!validatedFields.success) {
    const errors = formatZodErrors(validatedFields.error);
    return {
      success: false,
      error: Object.values(errors)[0] ?? "Validation failed",
    };
  }

  const characterData = validatedFields.data;

  try {
    await insertCharacterRecord(characterData);

    revalidatePath(`/campaigns/${characterData.campaignId}/characters`);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Database Error: Failed to create character.",
    };
  }
}

export async function updateCharacter(
  id: number,
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = parseCharacterFormData(formData);

  if (!validatedFields.success) {
    const errors = formatZodErrors(validatedFields.error);
    return {
      success: false,
      error: Object.values(errors)[0] ?? "Validation failed",
    };
  }

  const characterData = validatedFields.data;

  try {
    await updateCharacterRecord(id, characterData);

    revalidatePath(`/campaigns/${characterData.campaignId}/characters`);
    return { success: true };
  } catch (error) {
    console.error("Database error updating character:", error);
    return {
      success: false,
      error: "Database Error: Failed to update character.",
    };
  }
}

export async function deleteCharacter(id: number): Promise<ActionResult> {
  try {
    const character = await db
      .select({ campaignId: characters.campaignId })
      .from(characters)
      .where(eq(characters.id, id))
      .limit(1);

    if (character.length > 0) {
      await db.delete(characters).where(eq(characters.id, id));
      revalidatePath(`/campaigns/${character[0].campaignId}/characters`);
      return { success: true };
    } else {
      return {
        success: false,
        message: "Character not found.",
      };
    }
  } catch (error) {
    console.error("Database error deleting character:", error);
    return {
      success: false,
      message: "Database Error: Failed to delete character.",
    };
  }
}

export async function deleteCharacterAction(
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const id = Number(formData.get("id"));
  return await deleteCharacter(id);
}
