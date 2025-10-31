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
import type { ImageInfo } from "@/lib/utils/imageUtils.client";
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

    type EntityContext = {
      images: unknown;
      campaignId?: number | null;
      adventureId?: number | null;
    };

    type EntityHandler = {
      fetch: (entityId: number) => Promise<EntityContext | null>;
      update: (
        entityId: number,
        updatedImages: ImageInfo[],
        timestamp: string,
      ) => Promise<void>;
      revalidate: (
        entityId: number,
        context: EntityContext,
      ) => Array<string | null | undefined>;
    };

    const entityHandlers: Record<EntityType, EntityHandler> = {
      sessions: {
        async fetch(sessionId) {
          const [entity] = await db
            .select({
              images: sessions.images,
              campaignId: sessions.campaignId,
              adventureId: sessions.adventureId,
            })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);
          return entity ?? null;
        },
        async update(sessionId, updatedImages, ts) {
          await db
            .update(sessions)
            .set({
              images: JSON.stringify(updatedImages),
              updatedAt: ts,
            })
            .where(eq(sessions.id, sessionId));
        },
        revalidate(sessionId, context) {
          return [
            "/sessions",
            context.campaignId
              ? `/campaigns/${context.campaignId}/sessions`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/sessions/${sessionId}`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/sessions/${sessionId}/edit`
              : null,
          ];
        },
      },
      adventures: {
        async fetch(adventureId) {
          const [entity] = await db
            .select({
              images: adventures.images,
              campaignId: adventures.campaignId,
            })
            .from(adventures)
            .where(eq(adventures.id, adventureId))
            .limit(1);
          return entity ?? null;
        },
        async update(adventureId, updatedImages, ts) {
          await db
            .update(adventures)
            .set({
              images: JSON.stringify(updatedImages),
              updatedAt: ts,
            })
            .where(eq(adventures.id, adventureId));
        },
        revalidate(adventureId, context) {
          return [
            "/adventures",
            context.campaignId
              ? `/campaigns/${context.campaignId}/adventures`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/adventures/${adventureId}`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/adventures/${adventureId}/edit`
              : null,
          ];
        },
      },
      characters: {
        async fetch(characterId) {
          const [entity] = await db
            .select({
              images: characters.images,
              campaignId: characters.campaignId,
            })
            .from(characters)
            .where(eq(characters.id, characterId))
            .limit(1);
          return entity ?? null;
        },
        async update(characterId, updatedImages, ts) {
          await db
            .update(characters)
            .set({
              images: JSON.stringify(updatedImages),
              updatedAt: ts,
            })
            .where(eq(characters.id, characterId));
        },
        revalidate(characterId, context) {
          return [
            "/characters",
            context.campaignId
              ? `/campaigns/${context.campaignId}/characters`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/characters/${characterId}`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/characters/${characterId}/edit`
              : null,
          ];
        },
      },
      locations: {
        async fetch(locationId) {
          const [entity] = await db
            .select({
              images: locations.images,
              campaignId: locations.campaignId,
            })
            .from(locations)
            .where(eq(locations.id, locationId))
            .limit(1);
          return entity ?? null;
        },
        async update(locationId, updatedImages, ts) {
          await db
            .update(locations)
            .set({
              images: JSON.stringify(updatedImages),
              updatedAt: ts,
            })
            .where(eq(locations.id, locationId));
        },
        revalidate(locationId, context) {
          return [
            context.campaignId
              ? `/campaigns/${context.campaignId}/locations`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/locations/${locationId}`
              : null,
            context.campaignId
              ? `/campaigns/${context.campaignId}/locations/${locationId}/edit`
              : null,
          ];
        },
      },
      quests: {
        async fetch(questId) {
          const [entity] = await db
            .select({
              images: quests.images,
              adventureId: quests.adventureId,
              campaignId: adventures.campaignId,
            })
            .from(quests)
            .leftJoin(adventures, eq(quests.adventureId, adventures.id))
            .where(eq(quests.id, questId))
            .limit(1);
          return entity ?? null;
        },
        async update(questId, updatedImages, ts) {
          await db
            .update(quests)
            .set({
              images: JSON.stringify(updatedImages),
              updatedAt: ts,
            })
            .where(eq(quests.id, questId));
        },
        revalidate(questId, context) {
          return [
            context.campaignId
              ? `/campaigns/${context.campaignId}/quests`
              : null,
            context.campaignId && context.adventureId
              ? `/campaigns/${context.campaignId}/adventures/${context.adventureId}/quests`
              : null,
            context.campaignId && context.adventureId
              ? `/campaigns/${context.campaignId}/adventures/${context.adventureId}/quests/${questId}`
              : null,
            context.campaignId && context.adventureId
              ? `/campaigns/${context.campaignId}/adventures/${context.adventureId}/quests/${questId}/edit`
              : null,
          ];
        },
      },
      "magic-items": {
        async fetch(itemId) {
          const [entity] = await db
            .select({
              images: magicItems.images,
            })
            .from(magicItems)
            .where(eq(magicItems.id, itemId))
            .limit(1);
          return entity ?? null;
        },
        async update(itemId, updatedImages, ts) {
          await db
            .update(magicItems)
            .set({
              images: JSON.stringify(updatedImages),
              updatedAt: ts,
            })
            .where(eq(magicItems.id, itemId));
        },
        revalidate(itemId) {
          return [
            "/magic-items",
            `/magic-items/${itemId}`,
            `/magic-items/${itemId}/edit`,
          ];
        },
      },
    };

    const handler = entityHandlers[entityType];
    if (!handler) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    const entity = await handler.fetch(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityType} ${entityId}`);
    }

    const currentImages = parseImagesJson(entity.images);
    const updatedImages = [...currentImages, ...newImages];

    await handler.update(entityId, updatedImages, timestamp);
    revalidatePaths(handler.revalidate(entityId, entity));
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
