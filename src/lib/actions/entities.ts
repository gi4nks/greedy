"use server";
import { getCharacterWithAllEntities } from "@/lib/db/queries";
import { getMagicItemById } from "@/lib/actions/magicItems";
import { getSession } from "@/lib/actions/sessions";
import { db } from "@/lib/db";
import { eq, and, count } from "drizzle-orm";
import {
  locations,
  adventures,
  campaigns,
  gameEditions,
  wikiArticleEntities,
  wikiArticles,
  quests,
  magicItems,
  magicItemAssignments,
  relations,
  sessions,
} from "@/lib/db/schema";
import type { WikiEntity } from "@/lib/types/wiki";

/**
 * Standardized entity fetching functions
 * All entity pages should use these functions for consistent data fetching
 */

/**
 * Get a character by ID with all related entities
 */
export async function getCharacterById(characterId: number) {
  if (!characterId || characterId <= 0) {
    return null;
  }

  try {
    return await getCharacterWithAllEntities(characterId);
  } catch (error) {
    console.error("Error fetching character:", error);
    return null;
  }
}

/**
 * Get a location by ID with all related entities
 */
export async function getLocationById(locationId: number) {
  if (!locationId || locationId <= 0) {
    return null;
  }

  try {
    // Get location with related data
    const [location] = await db
      .select({
        id: locations.id,
        campaignId: locations.campaignId,
        adventureId: locations.adventureId,
        name: locations.name,
        description: locations.description,
        tags: locations.tags,
        images: locations.images,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
        adventure: {
          id: adventures.id,
          title: adventures.title,
          campaignId: adventures.campaignId,
        },
      })
      .from(locations)
      .leftJoin(adventures, eq(locations.adventureId, adventures.id))
      .where(eq(locations.id, locationId))
      .limit(1);

    if (!location) return null;

    // Get campaign info
    const campaign = location.campaignId
      ? await db
          .select({
            id: campaigns.id,
            title: campaigns.title,
            gameEditionName: gameEditions.name,
            gameEditionVersion: gameEditions.version,
          })
          .from(campaigns)
          .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
          .where(eq(campaigns.id, location.campaignId))
          .limit(1)
          .then((result) => result[0] || null)
      : null;

    // Get wiki entities
    const wikiEntitiesData = await db
      .select({
        id: wikiArticles.id,
        title: wikiArticles.title,
        contentType: wikiArticles.contentType,
        rawContent: wikiArticles.rawContent,
        parsedData: wikiArticles.parsedData,
        wikiUrl: wikiArticles.wikiUrl,
        importedFrom: wikiArticles.importedFrom,
        relationshipType: wikiArticleEntities.relationshipType,
        relationshipData: wikiArticleEntities.relationshipData,
      })
      .from(wikiArticleEntities)
      .innerJoin(
        wikiArticles,
        eq(wikiArticleEntities.wikiArticleId, wikiArticles.id),
      )
      .where(
        and(
          eq(wikiArticleEntities.entityType, "location"),
          eq(wikiArticleEntities.entityId, locationId),
        ),
      );

    const wikiEntities: WikiEntity[] = wikiEntitiesData.map((entity) => ({
      id: entity.id,
      title: entity.title,
      contentType: entity.contentType,
      description: entity.rawContent || "",
      parsedData: entity.parsedData,
      wikiUrl: entity.wikiUrl || undefined,
      importedFrom: entity.importedFrom,
      relationshipType: entity.relationshipType || undefined,
      relationshipData: entity.relationshipData,
    }));

    // Get magic items
    const magicItemsForLocation = await db
      .select({
        assignmentId: magicItemAssignments.id,
        magicItemId: magicItems.id,
        name: magicItems.name,
        rarity: magicItems.rarity,
        type: magicItems.type,
        description: magicItems.description,
        source: magicItemAssignments.source,
        notes: magicItemAssignments.notes,
        assignedAt: magicItemAssignments.assignedAt,
      })
      .from(magicItemAssignments)
      .innerJoin(magicItems, eq(magicItemAssignments.magicItemId, magicItems.id))
      .where(
        and(
          eq(magicItemAssignments.entityType, "location"),
          eq(magicItemAssignments.entityId, locationId),
        ),
      );

    // Get linked quests
    const linkedQuestsData = await db
      .select({
        id: quests.id,
        title: quests.title,
        status: quests.status,
        type: quests.type,
        relationType: relations.relationType,
      })
      .from(relations)
      .innerJoin(quests, eq(relations.sourceEntityId, quests.id))
      .where(
        and(
          eq(relations.targetEntityType, "location"),
          eq(relations.targetEntityId, locationId),
          eq(relations.sourceEntityType, "quest"),
        ),
      );

    return {
      ...location,
      campaign,
      wikiEntities,
      magicItems: magicItemsForLocation,
      linkedQuests: linkedQuestsData,
    };
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
}

/**
 * Get a quest by ID with all related entities
 */
export async function getQuestById(questId: number) {
  if (!questId || questId <= 0) {
    return null;
  }

  try {
    // Get quest with related data
    const questResult = await db
      .select({
        quest: quests,
        adventure: {
          id: adventures.id,
          title: adventures.title,
          campaignId: adventures.campaignId,
        },
        campaign: {
          id: campaigns.id,
          title: campaigns.title,
          gameEditionName: gameEditions.name,
          gameEditionVersion: gameEditions.version,
        },
      })
      .from(quests)
      .leftJoin(adventures, eq(quests.adventureId, adventures.id))
      .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
      .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
      .where(eq(quests.id, questId))
      .limit(1);

    if (!questResult[0]) return null;

    const { quest, adventure, campaign } = questResult[0];

    // Get wiki entities
    const wikiEntitiesResult = await db
      .select({
        id: wikiArticles.id,
        title: wikiArticles.title,
        contentType: wikiArticles.contentType,
        wikiUrl: wikiArticles.wikiUrl,
      })
      .from(wikiArticleEntities)
      .innerJoin(wikiArticles, eq(wikiArticleEntities.wikiArticleId, wikiArticles.id))
      .where(
        and(
          eq(wikiArticleEntities.entityType, "quest"),
          eq(wikiArticleEntities.entityId, questId)
        )
      );

    const wikiEntities: WikiEntity[] = wikiEntitiesResult.map(entity => ({
      ...entity,
      wikiUrl: entity.wikiUrl || undefined,
    }));

    return {
      ...quest,
      adventure,
      campaign,
      wikiEntities,
    };
  } catch (error) {
    console.error("Error fetching quest:", error);
    return null;
  }
}

/**
 * Get a session by ID with all related entities
 */
export async function getSessionById(sessionId: number) {
  if (!sessionId || sessionId <= 0) {
    return null;
  }

  try {
    return await getSession(sessionId);
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

/**
 * Get an adventure by ID with all related entities
 */
export async function getAdventureById(adventureId: number) {
  if (!adventureId || adventureId <= 0) {
    return null;
  }

  try {
    // Get adventure details
    const [adventure] = await db
      .select({
        id: adventures.id,
        campaignId: adventures.campaignId,
        title: adventures.title,
        description: adventures.description,
        status: adventures.status,
        startDate: adventures.startDate,
        endDate: adventures.endDate,
        slug: adventures.slug,
        images: adventures.images,
        createdAt: adventures.createdAt,
        updatedAt: adventures.updatedAt,
      })
      .from(adventures)
      .where(eq(adventures.id, adventureId))
      .limit(1);

    if (!adventure) return null;

    // Get stats
    const [sessionCount] = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.adventureId, adventureId));

    const [questCount] = await db
      .select({ count: count() })
      .from(quests)
      .where(eq(quests.adventureId, adventureId));

    // Get magic items
    const magicItemsForAdventure = await db
      .select({
        assignmentId: magicItemAssignments.id,
        magicItemId: magicItems.id,
        name: magicItems.name,
        rarity: magicItems.rarity,
        type: magicItems.type,
        description: magicItems.description,
        source: magicItemAssignments.source,
        notes: magicItemAssignments.notes,
        assignedAt: magicItemAssignments.assignedAt,
      })
      .from(magicItemAssignments)
      .innerJoin(magicItems, eq(magicItemAssignments.magicItemId, magicItems.id))
      .where(
        and(
          eq(magicItemAssignments.entityType, "adventure"),
          eq(magicItemAssignments.entityId, adventureId),
        ),
      );

    // Get campaign info
    const [campaign] = adventure.campaignId
      ? await db
          .select({ title: campaigns.title })
          .from(campaigns)
          .where(eq(campaigns.id, adventure.campaignId))
          .limit(1)
      : [null];

    return {
      ...adventure,
      stats: {
        sessions: sessionCount?.count || 0,
        quests: questCount?.count || 0,
      },
      campaign: campaign?.title || "Unknown Campaign",
      magicItems: magicItemsForAdventure,
    };
  } catch (error) {
    console.error("Error fetching adventure:", error);
    return null;
  }
}

/**
 * Get a campaign by ID with all related entities
 */
export async function getCampaignById(campaignId: number) {
  if (!campaignId || campaignId <= 0) {
    return null;
  }

  try {
    const [campaign] = await db
      .select({
        id: campaigns.id,
        gameEditionId: campaigns.gameEditionId,
        gameEditionName: gameEditions.name,
        gameEditionVersion: gameEditions.version,
        title: campaigns.title,
        description: campaigns.description,
        status: campaigns.status,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
      })
      .from(campaigns)
      .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    return campaign || null;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return null;
  }
}

/**
 * Get a magic item by ID with all related entities
 */
export async function getMagicItemEntityById(itemId: number) {
  if (!itemId || itemId <= 0) {
    return null;
  }

  try {
    return await getMagicItemById(itemId);
  } catch (error) {
    console.error("Error fetching magic item:", error);
    return null;
  }
}
