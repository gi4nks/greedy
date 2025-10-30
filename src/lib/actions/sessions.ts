"use server";

import { db } from "@/lib/db";
import { sessions, adventures, campaigns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionWithWikiEntities } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types/api";
import type { Session } from "@/lib/db/schema";

export async function getSessions() {
  return await db
    .select({
      id: sessions.id,
      campaignId: sessions.campaignId,
      adventureId: sessions.adventureId,
      title: sessions.title,
      date: sessions.date,
      text: sessions.text,
      images: sessions.images,
      promotedTo: sessions.promotedTo,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      campaignTitle: campaigns.title,
    })
    .from(sessions)
    .leftJoin(adventures, eq(sessions.adventureId, adventures.id))
    .leftJoin(campaigns, eq(sessions.campaignId, campaigns.id))
    .orderBy(desc(sessions.date));
}

export async function getSession(id: number) {
  const session = await getSessionWithWikiEntities(id);

  if (!session) return null;

  // Get campaign info separately since the optimized query doesn't include it
  const [campaignInfo] = await db
    .select({
      campaignId: sessions.campaignId,
      campaignTitle: campaigns.title,
    })
    .from(sessions)
    .leftJoin(campaigns, eq(sessions.campaignId, campaigns.id))
    .where(eq(sessions.id, id))
    .limit(1);

  return {
    ...session,
    campaignId: campaignInfo?.campaignId || null,
    campaignTitle: campaignInfo?.campaignTitle || null,
  };
}

export async function createSession(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const adventureIdValue = formData.get("adventureId") as string;
  const adventureId = adventureIdValue && adventureIdValue !== "none"
    ? Number(adventureIdValue)
    : null;
  const text = formData.get("text") as string;
  const images = formData.get("images") as string;
  const campaignId = formData.get("campaignId") as string;

  if (!title || !date) {
    return {
      success: false,
      error: "Title and date are required",
    };
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [session] = await db
      .insert(sessions)
      .values({
        campaignId: campaignId ? Number(campaignId) : null,
        title,
        date,
        adventureId,
        text: text || null,
        images: images ? JSON.parse(images) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Revalidate campaign-specific sessions path
    if (campaignId) {
      revalidatePath(`/campaigns/${campaignId}/sessions`);
    } else {
      revalidatePath("/sessions");
    }

    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      error: "Failed to create session",
    };
  }
}

export async function updateSession(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const adventureIdValue = formData.get("adventureId") as string;
  const adventureId = adventureIdValue && adventureIdValue !== "none"
    ? Number(adventureIdValue)
    : null;
  const text = formData.get("text") as string;
  const imagesValue = formData.get("images") as string;
  const campaignId = formData.get("campaignId") as string;

  if (!title || !date) {
    return {
      success: false,
      error: "Title and date are required",
    };
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Parse images if provided
    let parsedImages: any = null;
    if (imagesValue) {
      try {
        parsedImages = JSON.parse(imagesValue);
      } catch (e) {
        console.error("Error parsing images JSON:", e);
        parsedImages = null;
      }
    }

    const [session] = await db
      .update(sessions)
      .set({
        campaignId: campaignId ? Number(campaignId) : undefined,
        adventureId: adventureId || undefined,
        title,
        date,
        text: text || null,
        images: parsedImages || undefined,
        updatedAt: now,
      } as any)
      .where(eq(sessions.id, id))
      .returning();

    // Revalidate campaign-specific sessions path
    if (campaignId) {
      revalidatePath(`/campaigns/${campaignId}/sessions`);
    } else {
      revalidatePath("/sessions");
    }

    return { success: true };
  } catch (error) {
    console.error("Database error in updateSession:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to update session: ${errorMessage}`,
    };
  }
}

export async function deleteSession(id: number): Promise<ActionResult> {
  try {
    // First get the session to determine campaign context for revalidation
    const session = await getSession(id);

    // Delete the session
    await db.delete(sessions).where(eq(sessions.id, id));

    // Revalidate appropriate paths
    if (session?.campaignId) {
      revalidatePath(`/campaigns/${session.campaignId}/sessions`);
    } else {
      revalidatePath("/sessions");
    }

    return { success: true };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Failed to delete session",
    };
  }
}

export async function deleteSessionAction(
  formData: FormData,
): Promise<void> {
  "use server";
  const id = Number(formData.get("id"));
  const result = await deleteSession(id);
  if (!result.success) {
    throw new Error(result.message || "Failed to delete session");
  }
}
