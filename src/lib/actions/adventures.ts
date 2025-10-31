"use server";

import { db } from "@/lib/db";
import { adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types/api";

export async function getAdventures(campaignId?: number) {
  if (campaignId) {
    return await db
      .select()
      .from(adventures)
      .where(eq(adventures.campaignId, campaignId));
  }
  return await db.select().from(adventures);
}

export async function getAdventure(id: number) {
  const [adventure] = await db
    .select()
    .from(adventures)
    .where(eq(adventures.id, id))
    .limit(1);
  return adventure;
}

export async function createAdventure(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const campaignId = formData.get("campaignId")
    ? Number(formData.get("campaignId"))
    : null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const status = formData.get("status") as string;
  const slug = formData.get("slug") as string;
  const images = formData.get("images") as string;

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.insert(adventures).values({
      title,
      description: description || null,
      campaignId,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "planned",
      slug: slug || null,
      images: images ? JSON.parse(images) : null,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath(`/campaigns/${campaignId}/adventures`);
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Database Error: Failed to create adventure.",
    };
  }
}

export async function updateAdventure(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const campaignId = formData.get("campaignId")
    ? Number(formData.get("campaignId"))
    : null;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const status = formData.get("status") as string;
  const slug = formData.get("slug") as string;
  const images = formData.get("images") as string;

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db
      .update(adventures)
      .set({
        title,
        description: description || null,
        campaignId,
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || "planned",
        slug: slug || null,
        images: images ? JSON.parse(images) : null,
        updatedAt: now,
      })
      .where(eq(adventures.id, id));

    revalidatePath(`/campaigns/${campaignId}/adventures`);
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Database Error: Failed to update adventure.",
    };
  }
}

export async function deleteAdventure(
  id: number,
  campaignId: number,
): Promise<ActionResult> {
  try {
    await db.delete(adventures).where(eq(adventures.id, id));
    revalidatePath(`/campaigns/${campaignId}/adventures`);
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Database Error: Failed to delete adventure.",
    };
  }
}

export async function deleteAdventureAction(
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const id = Number(formData.get("id"));
  const campaignId = Number(formData.get("campaignId"));
  return await deleteAdventure(id, campaignId);
}
