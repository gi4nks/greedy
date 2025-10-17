"use server";

import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ActionResult } from "@/lib/types/api";
import { logger } from "@/lib/utils/logger";

const CreateCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  gameEditionId: z.number().optional().nullable(),
  worldName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable().default([]),
});

const UpdateCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  gameEditionId: z.number().optional().nullable(),
  worldName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable().default([]),
});

export async function createCampaign(
  state: ActionResult<{ id: number }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  console.log("🔥 createCampaign called");
  console.log("📝 Form data:", {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    gameEditionId: formData.get("gameEditionId"),
    worldName: formData.get("worldName"),
    tags: formData.get("tags"),
  });

  const validatedFields = CreateCampaignSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    gameEditionId: formData.get("gameEditionId")
      ? Number(formData.get("gameEditionId"))
      : undefined,
    worldName: formData.get("worldName"),
    tags: formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [],
  });

  if (!validatedFields.success) {
    console.error("❌ Validation failed:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  console.log("✅ Validation passed:", validatedFields.data);

  const {
    title,
    description,
    status,
    startDate,
    endDate,
    gameEditionId,
    tags,
  } = validatedFields.data;

  try {
    console.log("💾 Attempting to insert campaign into database...");
    const [campaign] = await db
      .insert(campaigns)
      .values({
        title,
        description,
        status: status || "active",
        startDate: startDate || null,
        endDate: endDate || null,
        gameEditionId: gameEditionId || 1, // Default to D&D 5e
        tags: JSON.stringify(tags),
      })
      .returning();

    console.log("✅ Campaign created successfully:", campaign);
    revalidatePath("/campaigns");
    console.log("🔄 Path revalidated, returning success");
    return {
      success: true,
      data: { id: campaign.id },
    };
  } catch (error) {
    console.error("💥 Database error creating campaign:", error);
    logger.error("Database error creating campaign", error);
    return {
      success: false,
      message: "Database Error: Failed to create campaign.",
    };
  }
}

export async function updateCampaign(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const validatedFields = UpdateCampaignSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    gameEditionId: formData.get("gameEditionId")
      ? Number(formData.get("gameEditionId"))
      : undefined,
    worldName: formData.get("worldName"),
    tags: formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [],
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await db
      .update(campaigns)
      .set({
        ...validatedFields.data,
        tags: JSON.stringify(validatedFields.data.tags),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, id));

    revalidatePath(`/campaigns/${id}`);
    return { success: true };
  } catch (error) {
    logger.error("Database error updating campaign", error);
    return {
      success: false,
      message: "Database Error: Failed to update campaign.",
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
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const tags = formData.get("tags") as string;

  if (!title) {
    return {
      success: false,
      errors: { title: ["Title is required"] },
    };
  }

  try {
    const [campaign] = await db
      .insert(campaigns)
      .values({
        title,
        description: description || null,
        status: status || "active",
        startDate: startDate || null,
        endDate: endDate || null,
        tags: tags
          ? JSON.stringify(
              tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t),
            )
          : null,
      })
      .returning();

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
