import { NextRequest, NextResponse } from "next/server";
import { uploadImages, EntityType } from "@/lib/utils/imageUtils";
import { db } from "@/lib/db";
import { sessions, adventures, characters, locations, quests, magicItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { revalidatePath } from "next/cache";

// Map entity types to their database tables and fields
const tableMap = {
  sessions: sessions,
  adventures: adventures,
  characters: characters,
  locations: locations,
  quests: quests,
  "magic-items": magicItems,
} as const;

async function updateEntityImages(
  entityType: EntityType,
  entityId: number,
  newImages: Array<{ filename: string; url: string; thumbnailUrl?: string; uploadedAt: string }>,
) {
  try {
    const table = tableMap[entityType];
    if (!table) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Fetch current images from entity
    const [entity] = await db
      .select({ images: table.images })
      .from(table)
      .where(eq(table.id, entityId))
      .limit(1);

    if (!entity) {
      throw new Error(`Entity not found: ${entityType} ${entityId}`);
    }

    // Parse existing images
    const currentImages = parseImagesJson(entity.images);
    
    // Combine with new images
    const updatedImages = [...currentImages, ...newImages];

    // Update database
    await db
      .update(table)
      .set({
        images: JSON.stringify(updatedImages),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(table.id, entityId));

    // Revalidate cache for this entity's pages
    // We need to revalidate the entity detail page and any listing pages
    if (entityType === "sessions") {
      // We don't know the campaignId here, so revalidate all sessions paths
      revalidatePath("/campaigns/[id]/sessions", "layout");
      revalidatePath("/campaigns/[id]/sessions/[sessionId]", "layout");
      revalidatePath("/campaigns/[id]/sessions/[sessionId]/edit", "layout");
    } else if (entityType === "adventures") {
      revalidatePath("/campaigns/[id]/adventures", "layout");
      revalidatePath("/campaigns/[id]/adventures/[adventureId]", "layout");
      revalidatePath("/campaigns/[id]/adventures/[adventureId]/edit", "layout");
    } else if (entityType === "characters") {
      revalidatePath("/campaigns/[id]/characters", "layout");
      revalidatePath("/campaigns/[id]/characters/[characterId]", "layout");
      revalidatePath("/campaigns/[id]/characters/[characterId]/edit", "layout");
    } else if (entityType === "locations") {
      revalidatePath("/campaigns/[id]/locations", "layout");
      revalidatePath("/campaigns/[id]/locations/[locationId]", "layout");
      revalidatePath("/campaigns/[id]/locations/[locationId]/edit", "layout");
    } else if (entityType === "quests") {
      revalidatePath("/campaigns/[id]/adventures/[adventureId]/quests", "layout");
      revalidatePath("/campaigns/[id]/adventures/[adventureId]/quests/[questId]", "layout");
      revalidatePath("/campaigns/[id]/adventures/[adventureId]/quests/[questId]/edit", "layout");
    } else if (entityType === "magic-items") {
      revalidatePath("/magic-items", "layout");
      revalidatePath("/magic-items/[id]", "layout");
      revalidatePath("/magic-items/[id]/edit", "layout");
    }
  } catch (error) {
    console.error("Error updating entity images:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entityType = formData.get("entityType") as EntityType;
    const entityId = parseInt(formData.get("entityId") as string);

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing entityType or entityId" },
        { status: 400 },
      );
    }

    // Extract files from formData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Upload files
    const results = await uploadImages(files, entityType, entityId);

    // Convert upload results to image info format and update database
    const successfulUploads = results
      .filter((result) => result.success)
      .map((result) => ({
        filename: result.filename!,
        url: result.url!,
        thumbnailUrl: result.thumbnailUrl,
        uploadedAt: new Date().toISOString(),
      }));

    if (successfulUploads.length > 0) {
      try {
        await updateEntityImages(entityType, entityId, successfulUploads);
      } catch (error) {
        console.error("Failed to update entity images in database:", error);
        // Still return the upload results even if database update fails
        // The images are still on disk and accessible
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
