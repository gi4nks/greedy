"use server";

import { db } from "@/lib/db";
import { quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types/api";
import type { Quest } from "@/lib/db/schema";

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
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const adventureId = formData.get("adventureId")
    ? Number(formData.get("adventureId"))
    : null;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;
  const type = formData.get("type") as string;
  const dueDate = formData.get("dueDate") as string;
  const assignedTo = formData.get("assignedTo") as string;
  const tagsString = formData.get("tags") as string;
  const images = formData.get("images") as string;
  const campaignId = formData.get("campaignId") as string;

  // Parse tags
  const tags = tagsString
    ? tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
    : [];

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [newQuest] = await db
      .insert(quests)
      .values({
        title,
        description: description || null,
        adventureId,
        status: status || "active",
        priority: priority || "medium",
        type: type || "main",
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        images: images ? JSON.parse(images) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Revalidate adventure-specific path if applicable
    if (adventureId) {
      revalidatePath(
        `/campaigns/${campaignId}/adventures/${adventureId}/quests`,
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
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const adventureId = formData.get("adventureId")
    ? Number(formData.get("adventureId"))
    : null;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;
  const type = formData.get("type") as string;
  const dueDate = formData.get("dueDate") as string;
  const assignedTo = formData.get("assignedTo") as string;
  const tagsString = formData.get("tags") as string;
  const images = formData.get("images") as string;
  const campaignId = formData.get("campaignId") as string;

  // Parse tags
  const tags = tagsString
    ? tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
    : [];

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [updatedQuest] = await db
      .update(quests)
      .set({
        title,
        description: description || null,
        adventureId,
        status: status || "active",
        priority: priority || "medium",
        type: type || "main",
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        images: images ? JSON.parse(images) : null,
        updatedAt: now,
      })
      .where(eq(quests.id, id))
      .returning();

    // Revalidate adventure-specific path if applicable
    if (adventureId) {
      revalidatePath(
        `/campaigns/${campaignId}/adventures/${adventureId}/quests`,
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
