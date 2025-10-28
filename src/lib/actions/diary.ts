"use server";

import { db } from "@/lib/db";
import {
  characters,
  characterDiaryEntries,
  locations,
  locationDiaryEntries,
  quests,
  questDiaryEntries,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DiaryEntrySchema } from "@/lib/validation/schemas";

export async function createDiaryEntry(
  entityType: "character" | "location" | "quest",
  entityId: number,
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const rawValues = {
    description: (formData.get("description") as string | null) ?? "",
    date: (formData.get("date") as string | null) ?? "",
    linkedEntities: (formData.get("linkedEntities") as string | null) ?? "",
    isImportant: formData.get("isImportant") === "on",
  };

  const normalized = {
    description: rawValues.description.trim(),
    date: rawValues.date.trim(),
    linkedEntities: rawValues.linkedEntities.trim() ? JSON.parse(rawValues.linkedEntities) : [],
    isImportant: rawValues.isImportant,
  };

  const parsed = DiaryEntrySchema.safeParse(normalized);

  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation failed";
    return { success: false, error: errorMessage };
  }

  try {
    let table;
    let entityTable;
    let entityColumn;

    switch (entityType) {
      case "character":
        table = characterDiaryEntries;
        entityTable = characters;
        entityColumn = "characterId";
        break;
      case "location":
        table = locationDiaryEntries;
        entityTable = locations;
        entityColumn = "locationId";
        break;
      case "quest":
        table = questDiaryEntries;
        entityTable = quests;
        entityColumn = "questId";
        break;
    }

    // Check if entity exists
    const [entity] = await db
      .select()
      .from(entityTable)
      .where(eq(entityTable.id, entityId));

    if (!entity) {
      return { success: false, error: `${entityType} not found` };
    }

    const [newEntry] = await db
      .insert(table)
      .values({
        [entityColumn]: entityId,
        description: parsed.data.description,
        date: parsed.data.date,
        linkedEntities: parsed.data.linkedEntities.length > 0 ? JSON.stringify(parsed.data.linkedEntities) : null,
        isImportant: parsed.data.isImportant,
      })
      .returning();

    const parsedEntry = {
      ...newEntry,
      linkedEntities: newEntry.linkedEntities ? JSON.parse(newEntry.linkedEntities as string) : [],
    };

    revalidatePath(`/${entityType}s/${entityId}`);
    return { success: true, data: parsedEntry };
  } catch (error) {
    console.error(`Failed to create ${entityType} diary entry`, error);
    return {
      success: false,
      error: `Failed to create diary entry. Please try again.`,
    };
  }
}

export async function updateDiaryEntry(
  entityType: "character" | "location" | "quest",
  entityId: number,
  entryId: number,
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const rawValues = {
    description: (formData.get("description") as string | null) ?? "",
    date: (formData.get("date") as string | null) ?? "",
    linkedEntities: (formData.get("linkedEntities") as string | null) ?? "",
    isImportant: formData.get("isImportant") === "on",
  };

  const normalized = {
    description: rawValues.description.trim(),
    date: rawValues.date.trim(),
    linkedEntities: rawValues.linkedEntities.trim() ? JSON.parse(rawValues.linkedEntities) : [],
    isImportant: rawValues.isImportant,
  };

  const parsed = DiaryEntrySchema.safeParse(normalized);

  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation failed";
    return { success: false, error: errorMessage };
  }

  try {
    let table;
    let entityColumn;

    switch (entityType) {
      case "character":
        table = characterDiaryEntries;
        entityColumn = "characterId";
        break;
      case "location":
        table = locationDiaryEntries;
        entityColumn = "locationId";
        break;
      case "quest":
        table = questDiaryEntries;
        entityColumn = "questId";
        break;
    }

    const [updated] = await db
      .update(table)
      .set({
        description: parsed.data.description,
        date: parsed.data.date,
        linkedEntities: parsed.data.linkedEntities.length > 0 ? JSON.stringify(parsed.data.linkedEntities) : null,
        isImportant: parsed.data.isImportant,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(table.id, entryId))
      .returning();

    if (!updated) {
      return { success: false, error: "Diary entry not found or could not be updated." };
    }

    const parsedEntry = {
      ...updated,
      linkedEntities: updated.linkedEntities ? JSON.parse(updated.linkedEntities as string) : [],
    };

    revalidatePath(`/${entityType}s/${entityId}`);
    return { success: true, data: parsedEntry };
  } catch (error) {
    console.error(`Failed to update ${entityType} diary entry`, error);
    return {
      success: false,
      error: `Failed to update diary entry. Please try again.`,
    };
  }
}

export async function deleteDiaryEntry(
  entityType: "character" | "location" | "quest",
  entityId: number,
  entryId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    let table;

    switch (entityType) {
      case "character":
        table = characterDiaryEntries;
        break;
      case "location":
        table = locationDiaryEntries;
        break;
      case "quest":
        table = questDiaryEntries;
        break;
    }

    await db
      .delete(table)
      .where(eq(table.id, entryId));

    revalidatePath(`/${entityType}s/${entityId}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete ${entityType} diary entry`, error);
    return {
      success: false,
      error: `Failed to delete diary entry. Please try again.`,
    };
  }
}