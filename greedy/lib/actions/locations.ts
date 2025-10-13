"use server";

import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types/api";
import type { Location } from "@/lib/db/schema";

export async function getLocations(campaignId: number) {
  const locationList = await db
    .select()
    .from(locations)
    .where(eq(locations.campaignId, campaignId))
    .orderBy(locations.name);

  return locationList;
}

export async function getLocation(id: number) {
  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, id))
    .limit(1);
  return location;
}

export async function createLocation(
  formData: FormData,
): Promise<ActionResult<Location>> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const adventureId = formData.get("adventureId")
    ? Number(formData.get("adventureId"))
    : null;
  const tagsString = formData.get("tags") as string;
  const images = formData.get("images") as string;
  const campaignId = Number(formData.get("campaignId"));

  // Parse tags
  const tags = tagsString
    ? tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
    : [];

  try {
    const [newLocation] = await db
      .insert(locations)
      .values({
        name,
        description: description || null,
        campaignId,
        adventureId,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        images: images ? JSON.parse(images) : null,
      })
      .returning();

    revalidatePath(`/campaigns/${campaignId}/locations`);
    return { success: true, data: newLocation };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Database Error: Failed to create location.",
    };
  }
}

export async function updateLocation(
  formData: FormData,
): Promise<ActionResult<Location>> {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const adventureId = formData.get("adventureId")
    ? Number(formData.get("adventureId"))
    : null;
  const tagsString = formData.get("tags") as string;
  const images = formData.get("images") as string;
  const campaignId = Number(formData.get("campaignId"));

  // Parse tags
  const tags = tagsString
    ? tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t)
    : [];

  try {
    const [updatedLocation] = await db
      .update(locations)
      .set({
        name,
        description: description || null,
        campaignId,
        adventureId,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        images: images ? JSON.parse(images) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(locations.id, id))
      .returning();

    revalidatePath(`/campaigns/${campaignId}/locations`);
    return { success: true, data: updatedLocation };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Database Error: Failed to update location.",
    };
  }
}

export async function deleteLocation(
  id: number,
  campaignId: number,
): Promise<ActionResult> {
  try {
    await db.delete(locations).where(eq(locations.id, id));
    revalidatePath(`/campaigns/${campaignId}/locations`);
    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Database Error: Failed to delete location.",
    };
  }
}

export async function deleteLocationAction(
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const id = Number(formData.get("id"));
  const campaignId = Number(formData.get("campaignId"));
  return await deleteLocation(id, campaignId);
}
