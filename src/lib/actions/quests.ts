"use server";

import { db } from "@/lib/db";
import { quests, adventures } from "@/lib/db/schema";
import { parseQuestFormData, insertQuestRecord, updateQuestRecord } from "@/lib/services/quests";
import { ActionResult } from "@/lib/types/api";
import { formatZodErrors } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getQuests(campaignId?: number) {
  if (campaignId) {
    // Get quests for adventures in this campaign
    const questsWithAdventures = await db
      .select({
        quest: quests,
        adventure: adventures,
      })
      .from(quests)
      .leftJoin(adventures, eq(quests.adventureId, adventures.id))
      .where(eq(adventures.campaignId, campaignId));

    return questsWithAdventures.map((item) => item.quest);
  }
  return await db.select().from(quests);
}

export async function getQuest(id: number) {
  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, id))
    .limit(1);
  return quest;
}

export async function createQuest(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const parsed = parseQuestFormData(formData);
  if (!parsed.success) {
    const errors = formatZodErrors(parsed.error);
    return { success: false, error: Object.values(errors)[0] ?? "Validation failed" };
  }

  const questData = parsed.data;

  try {
    await insertQuestRecord(questData);

    // Revalidate adventure-specific path if applicable
    if (questData.campaignId && questData.adventureId) {
      revalidatePath(
        `/campaigns/${questData.campaignId}/adventures/${questData.adventureId}/quests`,
      );
    }

    // The redirect will be handled by the form component based on context
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Database Error: Failed to create quest.",
    };
  }
}

export async function updateQuest(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get("id"));
  const parsed = parseQuestFormData(formData);
  if (!parsed.success) {
    const errors = formatZodErrors(parsed.error);
    return { success: false, error: Object.values(errors)[0] ?? "Validation failed" };
  }

  const questData = parsed.data;

  try {
    await updateQuestRecord(id, questData);

    // Revalidate adventure-specific path if applicable
    if (questData.campaignId && questData.adventureId) {
      revalidatePath(
        `/campaigns/${questData.campaignId}/adventures/${questData.adventureId}/quests`,
      );
    }

    // The redirect will be handled by the form component based on context
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Database Error: Failed to update quest.",
    };
  }
}

export async function deleteQuest(
  id: number,
  campaignId: number,
): Promise<ActionResult> {
  try {
    await db.delete(quests).where(eq(quests.id, id));
    revalidatePath(`/campaigns/${campaignId}/quests`);
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Database Error: Failed to delete quest.",
    };
  }
}

export async function deleteQuestAction(
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const id = Number(formData.get("id"));
  const campaignId = Number(formData.get("campaignId"));
  return await deleteQuest(id, campaignId);
}
