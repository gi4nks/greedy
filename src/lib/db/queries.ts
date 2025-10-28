import { db } from "./index";
import {
  characters,
  adventures,
  campaigns,
  gameEditions,
  magicItems,
  magicItemAssignments,
  wikiArticles,
  wikiArticleEntities,
  sessions,
} from "./schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Optimized queries for reducing N+1 database fetches
 * These queries fetch related entities in single operations using joins
 */

/**
 * Get character with all related entities (adventure, campaign, magic items, wiki entities)
 * Reduces multiple queries to a single optimized query with joins
 */
export async function getCharacterWithAllEntities(characterId: number) {
  // Get character with adventure and campaign in a single query
  const characterWithRelations = await db
    .select({
      // Character fields
      id: characters.id,
      campaignId: characters.campaignId,
      adventureId: characters.adventureId,
      characterType: characters.characterType,
      name: characters.name,
      race: characters.race,
      background: characters.background,
      alignment: characters.alignment,
      strength: characters.strength,
      dexterity: characters.dexterity,
      constitution: characters.constitution,
      intelligence: characters.intelligence,
      wisdom: characters.wisdom,
      charisma: characters.charisma,
      hitPoints: characters.hitPoints,
      maxHitPoints: characters.maxHitPoints,
      armorClass: characters.armorClass,
      classes: characters.classes,
      description: characters.description,
      images: characters.images,
      tags: characters.tags,
      createdAt: characters.createdAt,
      updatedAt: characters.updatedAt,
      // Adventure fields
      adventure_id: adventures.id,
      adventure_campaignId: adventures.campaignId,
      adventure_slug: adventures.slug,
      adventure_title: adventures.title,
      adventure_description: adventures.description,
      adventure_startDate: adventures.startDate,
      adventure_endDate: adventures.endDate,
      adventure_status: adventures.status,
      adventure_images: adventures.images,
      adventure_createdAt: adventures.createdAt,
      adventure_updatedAt: adventures.updatedAt,
      // Campaign fields
      campaign_id: campaigns.id,
      campaign_gameEditionId: campaigns.gameEditionId,
      campaign_title: campaigns.title,
      campaign_description: campaigns.description,
      campaign_status: campaigns.status,
      campaign_startDate: campaigns.startDate,
      campaign_endDate: campaigns.endDate,
      campaign_tags: campaigns.tags,
      campaign_createdAt: campaigns.createdAt,
      campaign_updatedAt: campaigns.updatedAt,
      // Game Edition fields
      gameEdition_id: gameEditions.id,
      gameEdition_name: gameEditions.name,
      gameEdition_version: gameEditions.version,
    })
    .from(characters)
    .leftJoin(adventures, eq(characters.adventureId, adventures.id))
    .leftJoin(campaigns, eq(characters.campaignId, campaigns.id))
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .where(eq(characters.id, characterId))
    .limit(1);

  if (characterWithRelations.length === 0) {
    return null;
  }

  const characterData = characterWithRelations[0];

  // Get magic items in a single query
  const magicItemsResult = await db
    .select({
      id: magicItems.id,
      assignmentId: magicItemAssignments.id,
      name: magicItems.name,
      rarity: magicItems.rarity,
      type: magicItems.type,
      description: magicItems.description,
      source: sql<string>`COALESCE(${magicItemAssignments.source}, 'manual')`.as('source'), // Ensure non-null with default
      notes: magicItemAssignments.notes,
      metadata: magicItemAssignments.metadata,
      assignedAt: magicItemAssignments.assignedAt,
      campaignId: magicItemAssignments.campaignId,
    })
    .from(magicItemAssignments)
    .innerJoin(magicItems, eq(magicItemAssignments.magicItemId, magicItems.id))
    .where(
      and(
        eq(magicItemAssignments.entityType, "character"),
        eq(magicItemAssignments.entityId, characterId),
      ),
    );

  // Cast source to the expected union type
  const typedMagicItems = magicItemsResult.map(item => ({
    ...item,
    source: item.source as "manual" | "wiki"
  }));

  // Get wiki entities in a single query
  const wikiEntitiesResult = await db
    .select({
      id: wikiArticles.id,
      title: wikiArticles.title,
      contentType: wikiArticles.contentType,
      wikiUrl: wikiArticles.wikiUrl,
      description: wikiArticles.rawContent,
      parsedData: wikiArticles.parsedData,
      relationshipType: wikiArticleEntities.relationshipType,
      relationshipData: wikiArticleEntities.relationshipData,
    })
    .from(wikiArticleEntities)
    .innerJoin(
      wikiArticles,
      eq(wikiArticleEntities.wikiArticleId, wikiArticles.id),
    )
    .where(
      sql`${wikiArticleEntities.entityType} = 'character' AND ${wikiArticleEntities.entityId} = ${characterId}`,
    );

  // Convert null wikiUrl to undefined to match WikiEntity type
  const typedWikiEntities = wikiEntitiesResult.map(entity => ({
    ...entity,
    wikiUrl: entity.wikiUrl || undefined,
    description: entity.description || undefined,
    relationshipType: entity.relationshipType || undefined,
  }));

  // Transform the flat result into the expected nested structure
  const character = {
    id: characterData.id,
    campaignId: characterData.campaignId,
    adventureId: characterData.adventureId,
    characterType: characterData.characterType,
    name: characterData.name,
    race: characterData.race,
    background: characterData.background,
    alignment: characterData.alignment,
    strength: characterData.strength,
    dexterity: characterData.dexterity,
    constitution: characterData.constitution,
    intelligence: characterData.intelligence,
    wisdom: characterData.wisdom,
    charisma: characterData.charisma,
    hitPoints: characterData.hitPoints,
    maxHitPoints: characterData.maxHitPoints,
    armorClass: characterData.armorClass,
    classes: characterData.classes,
    description: characterData.description,
    images: characterData.images,
    tags: characterData.tags,
    createdAt: characterData.createdAt,
    updatedAt: characterData.updatedAt,
    // Related entities
    adventure: characterData.adventure_id
      ? {
          id: characterData.adventure_id,
          campaignId: characterData.adventure_campaignId,
          slug: characterData.adventure_slug,
          title: characterData.adventure_title!, // Assert non-null since database field is NOT NULL
          description: characterData.adventure_description,
          startDate: characterData.adventure_startDate,
          endDate: characterData.adventure_endDate,
          status: characterData.adventure_status,
          images: characterData.adventure_images,
          createdAt: characterData.adventure_createdAt,
          updatedAt: characterData.adventure_updatedAt,
        }
      : null,
    campaign: characterData.campaign_id
      ? {
          id: characterData.campaign_id,
          gameEditionId: characterData.campaign_gameEditionId,
          gameEditionName: characterData.gameEdition_name,
          gameEditionVersion: characterData.gameEdition_version,
          title: characterData.campaign_title!, // Assert non-null since database field is NOT NULL
          description: characterData.campaign_description,
          status: characterData.campaign_status,
          startDate: characterData.campaign_startDate,
          endDate: characterData.campaign_endDate,
          tags: characterData.campaign_tags,
          createdAt: characterData.campaign_createdAt,
          updatedAt: characterData.campaign_updatedAt,
        }
      : null,
    magicItems: typedMagicItems,
    wikiEntities: typedWikiEntities,
  };

  return character;
}

/**
 * Get session with all related wiki entities
 * Reduces multiple queries to a single optimized query with joins
 */
export async function getSessionWithWikiEntities(sessionId: number) {
  // Get session with wiki entities in a single query
  const sessionWithWiki = await db
    .select({
      // Session fields
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
      // Wiki entity fields (nullable)
      wikiId: wikiArticles.id,
      wikiTitle: wikiArticles.title,
      wikiContentType: wikiArticles.contentType,
      wikiUrl: wikiArticles.wikiUrl,
      wikiDescription: wikiArticles.rawContent,
      wikiParsedData: wikiArticles.parsedData,
      wikiRelationshipType: wikiArticleEntities.relationshipType,
      wikiRelationshipData: wikiArticleEntities.relationshipData,
    })
    .from(sessions)
    .leftJoin(
      wikiArticleEntities,
      and(
        eq(wikiArticleEntities.entityType, "session"),
        eq(wikiArticleEntities.entityId, sessions.id),
      ),
    )
    .leftJoin(
      wikiArticles,
      eq(wikiArticleEntities.wikiArticleId, wikiArticles.id),
    )
    .where(eq(sessions.id, sessionId));

  if (sessionWithWiki.length === 0) {
    return null;
  }

  const sessionData = sessionWithWiki[0];

  // Group wiki entities (filtering out nulls)
  const wikiEntities = sessionWithWiki
    .filter((row) => row.wikiId !== null)
    .map((row) => ({
      id: row.wikiId!,
      title: row.wikiTitle!,
      contentType: row.wikiContentType!,
      wikiUrl: row.wikiUrl || undefined,
      description: row.wikiDescription || undefined,
      parsedData: row.wikiParsedData,
      relationshipType: row.wikiRelationshipType || undefined,
      relationshipData: row.wikiRelationshipData,
    }));

  // Transform into expected structure
  const session = {
    id: sessionData.id,
    campaignId: sessionData.campaignId,
    adventureId: sessionData.adventureId,
    title: sessionData.title,
    date: sessionData.date,
    text: sessionData.text,
    images: sessionData.images,
    promotedTo: sessionData.promotedTo,
    createdAt: sessionData.createdAt,
    updatedAt: sessionData.updatedAt,
    wikiEntities: wikiEntities,
  };

  return session;
}
