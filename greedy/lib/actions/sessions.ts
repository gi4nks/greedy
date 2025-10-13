"use server";

import { db } from "@/lib/db";
import { sessions, adventures, campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionWithWikiEntities } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types/api";
import type { Session } from "@/lib/db/schema";

export async function getSessions() {
  return await db
    .select({
      id: sessions.id,
      adventureId: sessions.adventureId,
      title: sessions.title,
      date: sessions.date,
      text: sessions.text,
      images: sessions.images,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      campaignId: adventures.campaignId,
      campaignTitle: campaigns.title,
    })
    .from(sessions)
    .leftJoin(adventures, eq(sessions.adventureId, adventures.id))
    .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
    .orderBy(sessions.date);
}

export async function getSession(id: number) {
  const session = await getSessionWithWikiEntities(id);

  if (!session) return null;

  // Get campaign info separately since the optimized query doesn't include it
  const [campaignInfo] = await db
    .select({
      campaignId: adventures.campaignId,
      campaignTitle: campaigns.title,
    })
    .from(sessions)
    .leftJoin(adventures, eq(sessions.adventureId, adventures.id))
    .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
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
): Promise<ActionResult<Session>> {
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const adventureId = formData.get("adventureId")
    ? Number(formData.get("adventureId"))
    : null;
  const text = formData.get("text") as string;
  const images = formData.get("images") as string;
  const campaignId = formData.get("campaignId") as string;

  if (!title || !date) {
    return {
      success: false,
      message: "Title and date are required",
    };
  }

  try {
    const [session] = await db
      .insert(sessions)
      .values({
        title,
        date,
        adventureId,
        text: text || null,
        images: images ? JSON.parse(images) : null,
      })
      .returning();

    // Revalidate campaign-specific sessions path
    if (campaignId) {
      revalidatePath(`/campaigns/${campaignId}/sessions`);
    } else {
      revalidatePath("/sessions");
    }

    return { success: true, data: session };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Failed to create session",
    };
  }
}

export async function updateSession(
  formData: FormData,
): Promise<ActionResult<Session>> {
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const adventureId = formData.get("adventureId")
    ? Number(formData.get("adventureId"))
    : null;
  const text = formData.get("text") as string;
  const images = formData.get("images") as string;
  const campaignId = formData.get("campaignId") as string;

  if (!title || !date) {
    return {
      success: false,
      message: "Title and date are required",
    };
  }

  try {
    const [session] = await db
      .update(sessions)
      .set({
        title,
        date,
        adventureId,
        text: text || null,
        images: images ? JSON.parse(images) : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessions.id, id))
      .returning();

    // Revalidate campaign-specific sessions path
    if (campaignId) {
      revalidatePath(`/campaigns/${campaignId}/sessions`);
    } else {
      revalidatePath("/sessions");
    }

    return { success: true, data: session };
  } catch (error) {
    console.error("Database error:", error);
    return {
      success: false,
      message: "Failed to update session",
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
): Promise<ActionResult> {
  "use server";
  const id = Number(formData.get("id"));
  return await deleteSession(id);
}
