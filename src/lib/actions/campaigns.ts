"use server";

import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionResult } from "@/lib/types/api";
import { logger } from "@/lib/utils/logger";
import { insertCampaignRecord, parseCampaignFormData, updateCampaignRecord } from "@/lib/services/campaigns";

export async function createCampaign(
  state: { success: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = parseCampaignFormData(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Validation failed",
    };
  }

  try {
    await insertCampaignRecord(validatedFields.data);
    revalidatePath("/campaigns");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Database error creating campaign", error);
    return {
      success: false,
      error: "Failed to create campaign",
    };
  }
}

export async function updateCampaign(
  id: number,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = parseCampaignFormData(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Validation failed",
    };
  }

  try {
    await updateCampaignRecord(id, validatedFields.data);

    revalidatePath(`/campaigns/${id}`);
    return { success: true };
  } catch (error) {
    logger.error("Database error updating campaign", error);
    return {
      success: false,
      error: "Failed to update campaign",
    };
  }
}

export async function deleteCampaign(id: number): Promise<ActionResult> {
  try {
    await db.delete(campaigns).where(eq(campaigns.id, id));
    revalidatePath("/campaigns");
    redirect("/campaigns");
  } catch (error) {
    logger.error("Database error deleting campaign", error);
    return {
      success: false,
      message: "Database Error: Failed to delete campaign.",
    };
  }
}

export async function createCampaignDirect(
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const validatedFields = parseCampaignFormData(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const campaign = await insertCampaignRecord(validatedFields.data);
    revalidatePath("/campaigns");
    redirect(`/campaigns/${campaign.id}`);
  } catch (error) {
    logger.error("Database error creating campaign direct", error);
    return {
      success: false,
      message: "Failed to create campaign",
    };
  }
}

export async function getCampaigns() {
  return await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      description: campaigns.description,
      status: campaigns.status,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      tags: campaigns.tags,
      gameEditionId: campaigns.gameEditionId,
      gameEditionName: gameEditions.name,
      gameEditionVersion: gameEditions.version,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
    })
    .from(campaigns)
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .orderBy(campaigns.createdAt);
}
