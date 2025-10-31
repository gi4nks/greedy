import { NextRequest, NextResponse } from "next/server";
import { uploadImages, EntityType } from "@/lib/utils/imageUtils";
import { db } from "@/lib/db";
import {
  sessions,
  adventures,
  characters,
  locations,
  quests,
  magicItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { revalidatePath } from "next/cache";

async function updateEntityImages(
  entityType: EntityType,
  entityId: number,
  newImages: Array<{ filename: string; url: string; thumbnailUrl?: string; uploadedAt: string }>,
) {
  try {
    const timestamp = new Date().toISOString();

    const revalidatePaths = (paths: Array<string | null | undefined>) => {
      const seen = new Set<string>();
      for (const path of paths) {
        if (!path || seen.has(path)) continue;
        seen.add(path);
        revalidatePath(path, "layout");
      }
    };

    if (entityType === "sessions") {
      const [entity] = await db
        .select({
          images: sessions.images,
          campaignId: sessions.campaignId,
          adventureId: sessions.adventureId,
        })
        .from(sessions)
        .where(eq(sessions.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error(`Entity not found: sessions ${entityId}`);
      }

      const currentImages = parseImagesJson(entity.images);
      const updatedImages = [...currentImages, ...newImages];

      await db
        .update(sessions)
        .set({
          images: JSON.stringify(updatedImages),
          updatedAt: timestamp,
        })
        .where(eq(sessions.id, entityId));

      revalidatePaths([
        "/sessions",
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/sessions`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/sessions/${entityId}`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/sessions/${entityId}/edit`
          : null,
      ]);
      return;
    }

    if (entityType === "adventures") {
      const [entity] = await db
        .select({
          images: adventures.images,
          campaignId: adventures.campaignId,
        })
        .from(adventures)
        .where(eq(adventures.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error(`Entity not found: adventures ${entityId}`);
      }

      const currentImages = parseImagesJson(entity.images);
      const updatedImages = [...currentImages, ...newImages];

      await db
        .update(adventures)
        .set({
          images: JSON.stringify(updatedImages),
          updatedAt: timestamp,
        })
        .where(eq(adventures.id, entityId));

      revalidatePaths([
        "/adventures",
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/adventures`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/adventures/${entityId}`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/adventures/${entityId}/edit`
          : null,
      ]);
      return;
    }

    if (entityType === "characters") {
      const [entity] = await db
        .select({
          images: characters.images,
          campaignId: characters.campaignId,
        })
        .from(characters)
        .where(eq(characters.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error(`Entity not found: characters ${entityId}`);
      }

      const currentImages = parseImagesJson(entity.images);
      const updatedImages = [...currentImages, ...newImages];

      await db
        .update(characters)
        .set({
          images: JSON.stringify(updatedImages),
          updatedAt: timestamp,
        })
        .where(eq(characters.id, entityId));

      revalidatePaths([
        "/characters",
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/characters`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/characters/${entityId}`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/characters/${entityId}/edit`
          : null,
      ]);
      return;
    }

    if (entityType === "locations") {
      const [entity] = await db
        .select({
          images: locations.images,
          campaignId: locations.campaignId,
        })
        .from(locations)
        .where(eq(locations.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error(`Entity not found: locations ${entityId}`);
      }

      const currentImages = parseImagesJson(entity.images);
      const updatedImages = [...currentImages, ...newImages];

      await db
        .update(locations)
        .set({
          images: JSON.stringify(updatedImages),
          updatedAt: timestamp,
        })
        .where(eq(locations.id, entityId));

      revalidatePaths([
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/locations`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/locations/${entityId}`
          : null,
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/locations/${entityId}/edit`
          : null,
      ]);
      return;
    }

    if (entityType === "quests") {
      const [entity] = await db
        .select({
          images: quests.images,
          adventureId: quests.adventureId,
          campaignId: adventures.campaignId,
        })
        .from(quests)
        .leftJoin(adventures, eq(quests.adventureId, adventures.id))
        .where(eq(quests.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error(`Entity not found: quests ${entityId}`);
      }

      const currentImages = parseImagesJson(entity.images);
      const updatedImages = [...currentImages, ...newImages];

      await db
        .update(quests)
        .set({
          images: JSON.stringify(updatedImages),
          updatedAt: timestamp,
        })
        .where(eq(quests.id, entityId));

      revalidatePaths([
        entity.campaignId
          ? `/campaigns/${entity.campaignId}/quests`
          : null,
        entity.campaignId && entity.adventureId
          ? `/campaigns/${entity.campaignId}/adventures/${entity.adventureId}/quests`
          : null,
        entity.campaignId && entity.adventureId
          ? `/campaigns/${entity.campaignId}/adventures/${entity.adventureId}/quests/${entityId}`
          : null,
        entity.campaignId && entity.adventureId
          ? `/campaigns/${entity.campaignId}/adventures/${entity.adventureId}/quests/${entityId}/edit`
          : null,
      ]);
      return;
    }

    if (entityType === "magic-items") {
      const [entity] = await db
        .select({
          images: magicItems.images,
        })
        .from(magicItems)
        .where(eq(magicItems.id, entityId))
        .limit(1);

      if (!entity) {
        throw new Error(`Entity not found: magic-items ${entityId}`);
      }

      const currentImages = parseImagesJson(entity.images);
      const updatedImages = [...currentImages, ...newImages];

      await db
        .update(magicItems)
        .set({
          images: JSON.stringify(updatedImages),
          updatedAt: timestamp,
        })
        .where(eq(magicItems.id, entityId));

      revalidatePaths([
        "/magic-items",
        `/magic-items/${entityId}`,
        `/magic-items/${entityId}/edit`,
      ]);
      return;
    }

    throw new Error(`Unsupported entity type: ${entityType}`);
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
