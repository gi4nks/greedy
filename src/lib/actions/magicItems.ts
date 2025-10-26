"use server";

import { db } from "@/lib/db";
import {
  campaigns,
  characters,
  adventures,
  locations,
  sessions,
  magicItems,
  magicItemAssignments,
  wikiArticles,
  wikiArticleEntities,
  type MagicItem,
} from "@/lib/db/schema";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SUPPORTED_MAGIC_ITEM_ENTITY_TYPES,
  type AssignableEntityOption,
  type MagicItemAssignableEntity,
} from "@/lib/magicItems/shared";
import { ActionResult } from "@/lib/types/api";

export interface EquipmentItem {
  name: string;
  isMagic: boolean;
  magicItemData?: {
    id: number;
    rarity: string | null;
    type: string | null;
    description: string | null;
    attunementRequired: boolean | null;
  };
}

export interface MagicItemAssignmentDetail {
  id: number;
  magicItemId: number;
  entityType: MagicItemAssignableEntity;
  entityId: number;
  entityName: string;
  entityDescription?: string | null;
  entityPath: string | null;
  campaignId: number | null;
  campaignTitle: string | null;
  source: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  assignedAt: string | null;
}

export interface MagicItemWithAssignments extends MagicItem {
  assignments: MagicItemAssignmentDetail[];
  source: "manual" | "wiki";
}

export interface MagicItemFilters {
  search?: string;
  type?: string;
  rarity?: string;
  entityType?: MagicItemAssignableEntity | "all";
  campaignId?: number;
}

export interface MagicItemFormState {
  errors?: Record<string, string[]>;
  message?: string;
}

function assertEntityType(
  entityType: string,
): asserts entityType is MagicItemAssignableEntity {
  if (
    !SUPPORTED_MAGIC_ITEM_ENTITY_TYPES.includes(
      entityType as MagicItemAssignableEntity,
    )
  ) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

function parseJsonColumn<T>(value: unknown): T | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse JSON column", error);
    return null;
  }
}

const ENTITY_PATH_BUILDERS: Record<
  MagicItemAssignableEntity,
  (payload: {
    entityId: number;
    campaignId: number | null;
    adventureId?: number | null;
  }) => string | null
> = {
  character: ({ entityId, campaignId }) =>
    campaignId
      ? `/campaigns/${campaignId}/characters/${entityId}`
      : `/characters/${entityId}`,
  location: ({ entityId, campaignId }) =>
    campaignId ? `/campaigns/${campaignId}/locations/${entityId}` : null,
  adventure: ({ entityId, campaignId }) =>
    campaignId ? `/campaigns/${campaignId}/adventures/${entityId}` : null,
  session: ({ entityId, campaignId, adventureId }) => {
    if (campaignId && adventureId) {
      return `/campaigns/${campaignId}/sessions/${entityId}`;
    }
    if (campaignId) {
      return `/campaigns/${campaignId}/sessions/${entityId}`;
    }
    return `/sessions/${entityId}`;
  },
};

/**
 * Fetch all magic items with their assignment metadata and optional filters.
 */
export async function getMagicItemsWithAssignments(
  filters: MagicItemFilters = {},
): Promise<MagicItemWithAssignments[]> {
  const { search, type, rarity, entityType, campaignId } = filters;

  // Query manual magic items
  const manualItemWhereClauses = [] as ReturnType<typeof eq>[];
  if (search) {
    const likePattern = `%${search.trim()}%`;
    manualItemWhereClauses.push(like(magicItems.name, likePattern));
  }
  if (type) {
    manualItemWhereClauses.push(eq(magicItems.type, type));
  }
  if (rarity) {
    manualItemWhereClauses.push(eq(magicItems.rarity, rarity));
  }

  const manualItems = await db
    .select({
      id: magicItems.id,
      name: magicItems.name,
      rarity: magicItems.rarity,
      type: magicItems.type,
      description: magicItems.description,
      properties: magicItems.properties,
      attunementRequired: magicItems.attunementRequired,
      images: magicItems.images,
      createdAt: magicItems.createdAt,
      updatedAt: magicItems.updatedAt,
    })
    .from(magicItems)
    .where(
      manualItemWhereClauses.length
        ? and(...manualItemWhereClauses)
        : undefined,
    );

  // Query wiki magic items
  const wikiItemWhereClauses = [] as ReturnType<typeof eq>[];
  wikiItemWhereClauses.push(eq(wikiArticles.contentType, "magic-item"));
  if (search) {
    const likePattern = `%${search.trim()}%`;
    wikiItemWhereClauses.push(like(wikiArticles.title, likePattern));
  }

  const wikiItemsRaw = await db
    .select({
      id: wikiArticles.id,
      name: wikiArticles.title,
      wikiUrl: wikiArticles.wikiUrl,
      rawContent: wikiArticles.rawContent,
      parsedData: wikiArticles.parsedData,
      createdAt: wikiArticles.createdAt,
      updatedAt: wikiArticles.updatedAt,
    })
    .from(wikiArticles)
    .where(
      wikiItemWhereClauses.length ? and(...wikiItemWhereClauses) : undefined,
    );

  // Transform wiki items to match MagicItem interface
  const wikiItems: MagicItem[] = wikiItemsRaw.map((item) => {
    const parsedData = parseJsonColumn<Record<string, unknown>>(
      item.parsedData,
    );

    // Extract description with better fallback logic
    let description: string | null = null;
    if (parsedData?.description && typeof parsedData.description === "string") {
      description = parsedData.description.trim();
    }

    // If no description in parsedData, try to extract from rawContent
    if (!description && item.rawContent) {
      // For wiki items, try to extract a reasonable description from rawContent
      // Look for content after the first heading or before certain markers
      const rawContent = item.rawContent.trim();
      if (rawContent.length > 0 && rawContent.length < 2000) {
        // If rawContent is reasonably short, use it as description
        description = rawContent;
      } else if (rawContent.includes("##")) {
        // Try to extract content before the first subheading
        const parts = rawContent.split("##");
        if (parts[0] && parts[0].trim().length > 10) {
          description = parts[0].trim();
        }
      }
    }

    return {
      id: item.id,
      name: typeof item.name === "string" ? item.name : `Magic Item ${item.id}`,
      rarity: typeof parsedData?.rarity === "string" ? parsedData.rarity : null,
      type: typeof parsedData?.type === "string" ? parsedData.type : null,
      description,
      properties: parsedData?.properties ?? null,
      attunementRequired:
        typeof parsedData?.attunementRequired === "boolean"
          ? parsedData.attunementRequired
          : null,
      images: parsedData?.images ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  // Combine all items
  const allItems: Array<MagicItem & { source: "manual" | "wiki" }> = [
    ...manualItems.map((item) => ({
      ...sanitizeMagicItem(item),
      source: "manual" as const,
    })),
    ...wikiItems.map((item) => ({
      ...sanitizeMagicItem(item),
      source: "wiki" as const,
    })),
  ];

  if (allItems.length === 0) {
    return [];
  }

  // Get assignments from both tables
  const manualItemIds = manualItems.map((item) => item.id);
  const wikiItemIds = wikiItems.map((item) => item.id);

  const [manualAssignments, wikiAssignments] = await Promise.all([
    manualItemIds.length
      ? db
          .select({
            id: magicItemAssignments.id,
            magicItemId: magicItemAssignments.magicItemId,
            entityType: magicItemAssignments.entityType,
            entityId: magicItemAssignments.entityId,
            campaignId: magicItemAssignments.campaignId,
            source: magicItemAssignments.source,
            notes: magicItemAssignments.notes,
            metadata: magicItemAssignments.metadata,
            assignedAt: magicItemAssignments.assignedAt,
          })
          .from(magicItemAssignments)
          .where(
            and(
              inArray(magicItemAssignments.magicItemId, manualItemIds),
              ...(campaignId
                ? [eq(magicItemAssignments.campaignId, campaignId)]
                : []),
              ...(entityType && entityType !== "all"
                ? [eq(magicItemAssignments.entityType, entityType)]
                : []),
            ),
          )
      : Promise.resolve([]),
    wikiItemIds.length
      ? db
          .select({
            id: wikiArticleEntities.id,
            magicItemId: wikiArticleEntities.wikiArticleId,
            entityType: wikiArticleEntities.entityType,
            entityId: wikiArticleEntities.entityId,
            campaignId: sql<number | null>`null`, // Wiki assignments don't have campaign context
            source: sql<string>`'wiki'`,
            notes: sql<string>`null`, // Wiki assignments don't have notes
            metadata: wikiArticleEntities.relationshipData,
            assignedAt: wikiArticleEntities.createdAt,
          })
          .from(wikiArticleEntities)
          .where(
            and(
              inArray(wikiArticleEntities.wikiArticleId, wikiItemIds),
              ...(entityType && entityType !== "all"
                ? [eq(wikiArticleEntities.entityType, entityType)]
                : []),
            ),
          )
      : Promise.resolve([]),
  ]);

  const allAssignments = [...manualAssignments, ...wikiAssignments];

  if (allAssignments.length === 0) {
    return allItems.map((item) => ({ ...item, assignments: [] }));
  }

  const characterIds = allAssignments
    .filter((assignment) => assignment.entityType === "character")
    .map((assignment) => assignment.entityId);
  const locationIds = allAssignments
    .filter((assignment) => assignment.entityType === "location")
    .map((assignment) => assignment.entityId);
  const adventureIds = allAssignments
    .filter((assignment) => assignment.entityType === "adventure")
    .map((assignment) => assignment.entityId);
  const sessionIds = allAssignments
    .filter((assignment) => assignment.entityType === "session")
    .map((assignment) => assignment.entityId);

  const [characterRows, locationRows, adventureRows, sessionRows] =
    await Promise.all([
      characterIds.length
        ? db
            .select({
              id: characters.id,
              name: characters.name,
              race: characters.race,
              campaignId: characters.campaignId,
              adventureId: characters.adventureId,
            })
            .from(characters)
            .where(inArray(characters.id, characterIds))
        : Promise.resolve([]),
      locationIds.length
        ? db
            .select({
              id: locations.id,
              name: locations.name,
              campaignId: locations.campaignId,
              adventureId: locations.adventureId,
            })
            .from(locations)
            .where(inArray(locations.id, locationIds))
        : Promise.resolve([]),
      adventureIds.length
        ? db
            .select({
              id: adventures.id,
              title: adventures.title,
              campaignId: adventures.campaignId,
            })
            .from(adventures)
            .where(inArray(adventures.id, adventureIds))
        : Promise.resolve([]),
      sessionIds.length
        ? db
            .select({
              id: sessions.id,
              title: sessions.title,
              date: sessions.date,
              adventureId: sessions.adventureId,
            })
            .from(sessions)
            .where(inArray(sessions.id, sessionIds))
        : Promise.resolve([]),
    ] as const);

  const campaignIds = new Set<number>();

  const characterMap = new Map(
    characterRows.map((row) => {
      if (row.campaignId) {
        campaignIds.add(row.campaignId);
      }
      return [row.id, row];
    }),
  );

  const locationMap = new Map(
    locationRows.map((row) => {
      if (row.campaignId) {
        campaignIds.add(row.campaignId);
      }
      return [row.id, row];
    }),
  );

  const adventureMap = new Map(
    adventureRows.map((row) => {
      if (row.campaignId) {
        campaignIds.add(row.campaignId);
      }
      return [row.id, row];
    }),
  );

  const sessionMap = new Map(sessionRows.map((row) => [row.id, row]));

  sessionRows.forEach((session) => {
    if (session.adventureId) {
      const adventure = adventureMap.get(session.adventureId);
      if (adventure?.campaignId) {
        campaignIds.add(adventure.campaignId);
      }
    }
  });

  allAssignments.forEach((assignment) => {
    if (assignment.campaignId) {
      campaignIds.add(assignment.campaignId);
    }
  });

  const campaignRows = campaignIds.size
    ? await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
        })
        .from(campaigns)
        .where(inArray(campaigns.id, Array.from(campaignIds)))
    : [];

  const campaignMap = new Map(campaignRows.map((row) => [row.id, row.title]));

  const assignmentsByItem = new Map<number, MagicItemAssignmentDetail[]>();

  allAssignments.forEach((assignment) => {
    const entityTypeValue = assignment.entityType as MagicItemAssignableEntity;
    if (!SUPPORTED_MAGIC_ITEM_ENTITY_TYPES.includes(entityTypeValue)) {
      return;
    }

    let entityName = "Unknown";
    let entityDescription: string | null = null;
    let campaignIdValue = assignment.campaignId ?? null;
    let adventureIdValue: number | null | undefined;

    switch (entityTypeValue) {
      case "character": {
        const character = characterMap.get(assignment.entityId);
        if (character) {
          entityName = character.name;
          entityDescription = character.race || null;
          campaignIdValue ??= character.campaignId ?? null;
          adventureIdValue = character.adventureId;
        }
        break;
      }
      case "location": {
        const location = locationMap.get(assignment.entityId);
        if (location) {
          entityName = location.name;
          campaignIdValue ??= location.campaignId ?? null;
          adventureIdValue = location.adventureId ?? null;
        }
        break;
      }
      case "adventure": {
        const adventure = adventureMap.get(assignment.entityId);
        if (adventure) {
          entityName = adventure.title;
          campaignIdValue ??= adventure.campaignId ?? null;
          adventureIdValue = adventure.id;
        }
        break;
      }
      case "session": {
        const session = sessionMap.get(assignment.entityId);
        if (session) {
          entityName = session.title;
          entityDescription = session.date ? session.date : null;
          if (session.adventureId) {
            const adventure = adventureMap.get(session.adventureId);
            campaignIdValue ??= adventure?.campaignId ?? null;
            adventureIdValue = adventure?.id;
          }
        }
        break;
      }
    }

    const metadata = parseJsonColumn<Record<string, unknown>>(
      assignment.metadata,
    );
    const entityPathBuilder = ENTITY_PATH_BUILDERS[entityTypeValue];
    const entityPath = entityPathBuilder({
      entityId: assignment.entityId,
      campaignId: campaignIdValue,
      adventureId: adventureIdValue,
    });

    const detail: MagicItemAssignmentDetail = {
      id: assignment.id,
      magicItemId: assignment.magicItemId,
      entityType: entityTypeValue,
      entityId: assignment.entityId,
      entityName,
      entityDescription,
      entityPath,
      campaignId: campaignIdValue,
      campaignTitle: campaignIdValue
        ? (campaignMap.get(campaignIdValue) ?? null)
        : null,
      source: assignment.source,
      notes: typeof assignment.notes === "string" ? assignment.notes : null,
      metadata,
      assignedAt: assignment.assignedAt,
    };

    if (!assignmentsByItem.has(assignment.magicItemId)) {
      assignmentsByItem.set(assignment.magicItemId, []);
    }

    assignmentsByItem.get(assignment.magicItemId)!.push(detail);
  });

  return allItems
    .map((item) => ({
      ...item,
      assignments:
        assignmentsByItem.get(item.id)?.map(sanitizeAssignment) ?? [],
    }))
    .filter((item) => {
      if (!entityType || entityType === "all") {
        return true;
      }
      return item.assignments.some(
        (assignment) => assignment.entityType === entityType,
      );
    });
}
export async function getMagicItemById(
  itemId: number,
): Promise<MagicItemWithAssignments | null> {
  if (!Number.isFinite(itemId)) {
    return null;
  }

  const items = await getMagicItemsWithAssignments();
  const item = items.find((maybeItem) => maybeItem.id === itemId) ?? null;
  if (!item) {
    return null;
  }

  return {
    ...sanitizeMagicItem(item),
    source: item.source,
    assignments: item.assignments.map(sanitizeAssignment),
  };
}

export async function searchAssignableEntities(
  entityType: MagicItemAssignableEntity,
  options: { search?: string; campaignId?: number; limit?: number } = {},
): Promise<AssignableEntityOption[]> {
  assertEntityType(entityType);

  const { search, campaignId, limit = 20 } = options;
  const searchPattern = search ? `%${search.trim()}%` : null;

  switch (entityType) {
    case "character": {
      const whereClauses = [] as ReturnType<typeof eq>[];
      if (campaignId) {
        whereClauses.push(eq(characters.campaignId, campaignId));
      }
      if (searchPattern) {
        whereClauses.push(like(characters.name, searchPattern));
      }

      const rows = await db
        .select({
          id: characters.id,
          name: characters.name,
          race: characters.race,
          campaignId: characters.campaignId,
          adventureId: characters.adventureId,
          campaignTitle: campaigns.title,
        })
        .from(characters)
        .leftJoin(campaigns, eq(characters.campaignId, campaigns.id))
        .where(whereClauses.length ? and(...whereClauses) : undefined)
        .orderBy(characters.name)
        .limit(limit);

      return rows.map((row) => {
        const descriptionParts = [] as string[];
        if (row.race) {
          descriptionParts.push(row.race);
        }

        const path = ENTITY_PATH_BUILDERS.character({
          entityId: row.id,
          campaignId: row.campaignId,
          adventureId: row.adventureId,
        });

        return {
          id: row.id,
          name: row.name,
          description: descriptionParts.length
            ? descriptionParts.join(" • ")
            : null,
          entityType: "character",
          campaignId: row.campaignId ?? null,
          campaignTitle: row.campaignTitle ?? null,
          path,
        } as AssignableEntityOption;
      });
    }
    case "location": {
      const whereClauses = [] as ReturnType<typeof eq>[];
      if (campaignId) {
        whereClauses.push(eq(locations.campaignId, campaignId));
      }
      if (searchPattern) {
        whereClauses.push(like(locations.name, searchPattern));
      }

      const rows = await db
        .select({
          id: locations.id,
          name: locations.name,
          campaignId: locations.campaignId,
          adventureId: locations.adventureId,
          campaignTitle: campaigns.title,
        })
        .from(locations)
        .leftJoin(campaigns, eq(locations.campaignId, campaigns.id))
        .where(whereClauses.length ? and(...whereClauses) : undefined)
        .orderBy(locations.name)
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.campaignTitle
          ? `Campaign • ${row.campaignTitle}`
          : null,
        entityType: "location",
        campaignId: row.campaignId ?? null,
        campaignTitle: row.campaignTitle ?? null,
        path: ENTITY_PATH_BUILDERS.location({
          entityId: row.id,
          campaignId: row.campaignId ?? null,
          adventureId: row.adventureId ?? null,
        }),
      }));
    }
    case "adventure": {
      const whereClauses = [] as ReturnType<typeof eq>[];
      if (campaignId) {
        whereClauses.push(eq(adventures.campaignId, campaignId));
      }
      if (searchPattern) {
        whereClauses.push(like(adventures.title, searchPattern));
      }

      const rows = await db
        .select({
          id: adventures.id,
          title: adventures.title,
          campaignId: adventures.campaignId,
          campaignTitle: campaigns.title,
        })
        .from(adventures)
        .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
        .where(whereClauses.length ? and(...whereClauses) : undefined)
        .orderBy(adventures.title)
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        name: row.title,
        description: row.campaignTitle
          ? `Campaign • ${row.campaignTitle}`
          : null,
        entityType: "adventure",
        campaignId: row.campaignId ?? null,
        campaignTitle: row.campaignTitle ?? null,
        path: ENTITY_PATH_BUILDERS.adventure({
          entityId: row.id,
          campaignId: row.campaignId ?? null,
        }),
      }));
    }
    case "session": {
      const whereClauses = [] as ReturnType<typeof eq>[];
      if (searchPattern) {
        whereClauses.push(like(sessions.title, searchPattern));
      }
      if (campaignId) {
        whereClauses.push(eq(adventures.campaignId, campaignId));
      }

      const rows = await db
        .select({
          id: sessions.id,
          title: sessions.title,
          date: sessions.date,
          adventureId: sessions.adventureId,
          campaignId: adventures.campaignId,
          campaignTitle: campaigns.title,
        })
        .from(sessions)
        .leftJoin(adventures, eq(sessions.adventureId, adventures.id))
        .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
        .where(whereClauses.length ? and(...whereClauses) : undefined)
        .orderBy(sessions.title)
        .limit(limit);

      return rows.map((row) => ({
        id: row.id,
        name: row.title,
        description: row.date ?? null,
        entityType: "session",
        campaignId: row.campaignId ?? null,
        campaignTitle: row.campaignTitle ?? null,
        path: ENTITY_PATH_BUILDERS.session({
          entityId: row.id,
          campaignId: row.campaignId ?? null,
          adventureId: row.adventureId ?? null,
        }),
      }));
    }
    default:
      return [];
  }
}

export interface UpsertMagicItemInput {
  name: string;
  rarity?: string | null;
  type?: string | null;
  description?: string | null;
  properties?: Record<string, unknown> | null;
  attunementRequired?: boolean;
  images?: unknown;
}

export async function createMagicItem(
  input: UpsertMagicItemInput,
): Promise<MagicItem> {
  const [created] = await db
    .insert(magicItems)
    .values({
      name: input.name,
      rarity: input.rarity ?? null,
      type: input.type ?? null,
      description: input.description ?? null,
      properties: input.properties ? JSON.stringify(input.properties) : null,
      attunementRequired: input.attunementRequired ?? false,
      images: input.images ? JSON.stringify(input.images) : null,
    })
    .returning();

  return created;
}

export async function updateMagicItem(
  itemId: number,
  input: UpsertMagicItemInput,
): Promise<MagicItem | null> {
  const [updated] = await db
    .update(magicItems)
    .set({
      name: input.name,
      rarity: input.rarity ?? null,
      type: input.type ?? null,
      description: input.description ?? null,
      properties: input.properties ? JSON.stringify(input.properties) : null,
      attunementRequired: input.attunementRequired ?? false,
      images: input.images ? JSON.stringify(input.images) : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(magicItems.id, itemId))
    .returning();

  return updated ?? null;
}

export async function deleteMagicItem(itemId: number): Promise<void> {
  await db
    .delete(magicItemAssignments)
    .where(eq(magicItemAssignments.magicItemId, itemId));
  await db.delete(magicItems).where(eq(magicItems.id, itemId));
}

export interface AssignMagicItemPayload {
  entityType: MagicItemAssignableEntity;
  entityIds: number[];
  source?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function assignMagicItemToEntities(
  itemId: number,
  payload: AssignMagicItemPayload,
): Promise<void> {
  assertEntityType(payload.entityType);

  if (!payload.entityIds?.length) {
    throw new Error("entityIds must contain at least one id");
  }

  // Check if this is a manual or wiki item
  const [manualItem] = await db
    .select({ id: magicItems.id })
    .from(magicItems)
    .where(eq(magicItems.id, itemId))
    .limit(1);

  if (manualItem) {
    // Handle manual magic item assignment
    const resolvedAssignments = [] as {
      magicItemId: number;
      entityType: MagicItemAssignableEntity;
      entityId: number;
      campaignId: number | null;
      source: string | null;
      notes: string | null;
      metadata: string | null;
    }[];

    for (const entityId of payload.entityIds) {
      const { campaignId } = await resolveEntityCampaign(
        payload.entityType,
        entityId,
      );
      resolvedAssignments.push({
        magicItemId: itemId,
        entityType: payload.entityType,
        entityId,
        campaignId,
        source: payload.source ?? "manual",
        notes: payload.notes ?? null,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      });
    }

    if (!resolvedAssignments.length) {
      return;
    }

    await db
      .insert(magicItemAssignments)
      .values(resolvedAssignments)
      .onConflictDoNothing();
  } else {
    // Handle wiki magic item assignment
    const [wikiItem] = await db
      .select({ id: wikiArticles.id })
      .from(wikiArticles)
      .where(
        and(
          eq(wikiArticles.id, itemId),
          eq(wikiArticles.contentType, "magic-item"),
        ),
      )
      .limit(1);

    if (!wikiItem) {
      throw new Error(`Magic item ${itemId} not found`);
    }

    const wikiAssignments = payload.entityIds.map((entityId) => ({
      wikiArticleId: itemId,
      entityType: payload.entityType,
      entityId,
      relationshipType: "owned", // Magic items are "owned" by entities
      relationshipData: {
        source: payload.source ?? "wiki",
        notes: payload.notes,
        metadata: payload.metadata,
      },
    }));

    await db
      .insert(wikiArticleEntities)
      .values(wikiAssignments)
      .onConflictDoNothing();
  }
}

export async function unassignMagicItem(
  itemId: number,
  entityType: MagicItemAssignableEntity,
  entityId: number,
): Promise<void> {
  assertEntityType(entityType);

  // Check if this is a manual or wiki item
  const [manualItem] = await db
    .select({ id: magicItems.id })
    .from(magicItems)
    .where(eq(magicItems.id, itemId))
    .limit(1);

  if (manualItem) {
    // Handle manual magic item unassignment
    await db
      .delete(magicItemAssignments)
      .where(
        and(
          eq(magicItemAssignments.magicItemId, itemId),
          eq(magicItemAssignments.entityType, entityType),
          eq(magicItemAssignments.entityId, entityId),
        ),
      );
  } else {
    // Handle wiki magic item unassignment
    const [wikiItem] = await db
      .select({ id: wikiArticles.id })
      .from(wikiArticles)
      .where(
        and(
          eq(wikiArticles.id, itemId),
          eq(wikiArticles.contentType, "magic-item"),
        ),
      )
      .limit(1);

    if (wikiItem) {
      await db
        .delete(wikiArticleEntities)
        .where(
          and(
            eq(wikiArticleEntities.wikiArticleId, itemId),
            eq(wikiArticleEntities.entityType, entityType),
            eq(wikiArticleEntities.entityId, entityId),
          ),
        );
    }
  }
}

async function resolveEntityCampaign(
  entityType: MagicItemAssignableEntity,
  entityId: number,
): Promise<{ campaignId: number | null }> {
  switch (entityType) {
    case "character": {
      const [character] = await db
        .select({
          campaignId: characters.campaignId,
          adventureId: characters.adventureId,
        })
        .from(characters)
        .where(eq(characters.id, entityId));

      if (!character) {
        throw new Error(`Character ${entityId} not found`);
      }

      if (character.campaignId) {
        return { campaignId: character.campaignId };
      }

      if (character.adventureId) {
        const [adventure] = await db
          .select({ campaignId: adventures.campaignId })
          .from(adventures)
          .where(eq(adventures.id, character.adventureId));
        return { campaignId: adventure?.campaignId ?? null };
      }

      return { campaignId: null };
    }
    case "location": {
      const [location] = await db
        .select({
          campaignId: locations.campaignId,
          adventureId: locations.adventureId,
        })
        .from(locations)
        .where(eq(locations.id, entityId));

      if (!location) {
        throw new Error(`Location ${entityId} not found`);
      }

      if (location.campaignId) {
        return { campaignId: location.campaignId };
      }

      if (location.adventureId) {
        const [adventure] = await db
          .select({ campaignId: adventures.campaignId })
          .from(adventures)
          .where(eq(adventures.id, location.adventureId));
        return { campaignId: adventure?.campaignId ?? null };
      }

      return { campaignId: null };
    }
    case "adventure": {
      const [adventure] = await db
        .select({ campaignId: adventures.campaignId })
        .from(adventures)
        .where(eq(adventures.id, entityId));

      if (!adventure) {
        throw new Error(`Adventure ${entityId} not found`);
      }

      return { campaignId: adventure.campaignId ?? null };
    }
    case "session": {
      const [session] = await db
        .select({
          adventureId: sessions.adventureId,
        })
        .from(sessions)
        .where(eq(sessions.id, entityId));

      if (!session) {
        throw new Error(`Session ${entityId} not found`);
      }

      if (session.adventureId) {
        const [adventure] = await db
          .select({ campaignId: adventures.campaignId })
          .from(adventures)
          .where(eq(adventures.id, session.adventureId));
        return { campaignId: adventure?.campaignId ?? null };
      }

      return { campaignId: null };
    }
    default:
      return { campaignId: null };
  }
}

/**
 * Server action to enrich equipment items with magic item data.
 */
export async function enrichEquipmentWithMagicItems(
  equipment: string[],
): Promise<EquipmentItem[]> {
  if (!equipment || equipment.length === 0) {
    return [];
  }

  try {
    // Get both manual and wiki magic items
    const manualItems = await db
      .select({
        id: magicItems.id,
        name: magicItems.name,
        rarity: magicItems.rarity,
        type: magicItems.type,
        description: magicItems.description,
        attunementRequired: magicItems.attunementRequired,
      })
      .from(magicItems);

    const wikiItemsRaw = await db
      .select({
        id: wikiArticles.id,
        name: wikiArticles.title,
        parsedData: wikiArticles.parsedData,
      })
      .from(wikiArticles)
      .where(eq(wikiArticles.contentType, "magic-item"));

    const wikiItems = wikiItemsRaw.map((item) => {
      const parsedData = parseJsonColumn<Record<string, unknown>>(
        item.parsedData,
      );
      return {
        id: item.id,
        name: item.name,
        rarity: (parsedData?.rarity as string | null) ?? null,
        type: (parsedData?.type as string | null) ?? null,
        description: (parsedData?.description as string | null) ?? null,
        attunementRequired:
          (parsedData?.attunementRequired as boolean | null) ?? null,
      };
    });

    const allMagicItems = [...manualItems, ...wikiItems];

    const magicItemMap = new Map<string, (typeof allMagicItems)[0]>();
    allMagicItems.forEach((item) => {
      magicItemMap.set(item.name.toLowerCase(), item);
    });

    return equipment.map((itemName) => {
      const normalizedName = itemName.toLowerCase().trim();
      const magicItem = magicItemMap.get(normalizedName);

      return {
        name: itemName,
        isMagic: !!magicItem,
        magicItemData: magicItem
          ? {
              id: magicItem.id,
              rarity: magicItem.rarity,
              type: magicItem.type,
              description: magicItem.description,
              attunementRequired: magicItem.attunementRequired,
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Error enriching equipment with magic items:", error);
    return equipment.map((name) => ({ name, isMagic: false }));
  }
}

/**
 * Lightweight helper for autocomplete/dropdowns.
 */
export async function getMagicItemNames(): Promise<string[]> {
  try {
    const manualNames = await db
      .select({ name: magicItems.name })
      .from(magicItems);
    const wikiNames = await db
      .select({ name: wikiArticles.title })
      .from(wikiArticles)
      .where(eq(wikiArticles.contentType, "magic-item"));

    const allNames = [
      ...manualNames.map((item) => item.name),
      ...wikiNames.map((item) => item.name),
    ];

    return allNames;
  } catch (error) {
    console.error("Error fetching magic item names:", error);
    return [];
  }
}

const MagicItemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().max(255).optional(),
  rarity: z.string().max(255).optional(),
  description: z.string().optional(),
  properties: z.string().optional(),
  images: z.string().optional(),
});

function parsePropertiesInput(value?: string): {
  properties: Record<string, unknown> | null;
  error?: string;
} {
  if (!value) {
    return { properties: null };
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return { properties: null, error: "Properties must be a JSON object." };
    }
    return { properties: parsed as Record<string, unknown> };
  } catch (error) {
    console.warn("Failed to parse magic item properties input", error);
    return { properties: null, error: "Properties must be valid JSON." };
  }
}

export async function createMagicItemAction(
  _: MagicItemFormState | undefined,
  formData: FormData,
): Promise<ActionResult<MagicItem>> {
  const rawValues = {
    name: (formData.get("name") as string | null) ?? "",
    type: (formData.get("type") as string | null) ?? "",
    rarity: (formData.get("rarity") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    properties: (formData.get("properties") as string | null) ?? "",
    images: (formData.get("images") as string | null) ?? "",
  };

  const normalized = {
    name: rawValues.name.trim(),
    type: rawValues.type.trim() || undefined,
    rarity: rawValues.rarity.trim() || undefined,
    description: rawValues.description.trim() || undefined,
    properties: rawValues.properties.trim() || undefined,
    images: rawValues.images.trim() || undefined,
  };

  const parsed = MagicItemFormSchema.safeParse(normalized);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { properties: parsedProperties, error } = parsePropertiesInput(
    parsed.data.properties,
  );

  if (error) {
    return {
      success: false,
      errors: { properties: [error] },
    };
  }

  const attunementRequired = formData.get("attunementRequired") === "on";

  let parsedImages: unknown = null;
  if (parsed.data.images) {
    try {
      parsedImages = JSON.parse(parsed.data.images);
    } catch (error) {
      console.warn("Failed to parse images input", error);
    }
  }

  try {
    const created = await createMagicItem({
      name: parsed.data.name,
      type: parsed.data.type ?? null,
      rarity: parsed.data.rarity ?? null,
      description: parsed.data.description ?? null,
      properties: parsedProperties,
      attunementRequired,
      images: parsedImages,
    });

    revalidatePath("/magic-items");
    return { success: true, data: created };
  } catch (caught) {
    console.error("Failed to create magic item", caught);
    return {
      success: false,
      message: "Failed to create magic item. Please try again.",
    };
  }
}

export async function updateMagicItemAction(
  _: MagicItemFormState | undefined,
  formData: FormData,
): Promise<ActionResult<MagicItem>> {
  const idValue = formData.get("id");
  const itemId =
    typeof idValue === "string" ? Number.parseInt(idValue, 10) : Number.NaN;

  if (!Number.isFinite(itemId)) {
    return {
      success: false,
      message: "Invalid magic item identifier.",
    };
  }

  const rawValues = {
    name: (formData.get("name") as string | null) ?? "",
    type: (formData.get("type") as string | null) ?? "",
    rarity: (formData.get("rarity") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    properties: (formData.get("properties") as string | null) ?? "",
    images: (formData.get("images") as string | null) ?? "",
  };

  const normalized = {
    name: rawValues.name.trim(),
    type: rawValues.type.trim() || undefined,
    rarity: rawValues.rarity.trim() || undefined,
    description: rawValues.description.trim() || undefined,
    properties: rawValues.properties.trim() || undefined,
    images: rawValues.images.trim() || undefined,
  };

  const parsed = MagicItemFormSchema.safeParse(normalized);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { properties: parsedProperties, error } = parsePropertiesInput(
    parsed.data.properties,
  );

  if (error) {
    return {
      success: false,
      errors: { properties: [error] },
    };
  }

  const attunementRequired = formData.get("attunementRequired") === "on";

  let parsedImages: unknown = null;
  if (parsed.data.images) {
    try {
      parsedImages = JSON.parse(parsed.data.images);
    } catch (error) {
      console.warn("Failed to parse images input", error);
    }
  }

  try {
    const updated = await updateMagicItem(itemId, {
      name: parsed.data.name,
      type: parsed.data.type ?? null,
      rarity: parsed.data.rarity ?? null,
      description: parsed.data.description ?? null,
      properties: parsedProperties,
      attunementRequired,
      images: parsedImages,
    });

    if (!updated) {
      return {
        success: false,
        message: "Magic item not found or could not be updated.",
      };
    }

    revalidatePath("/magic-items");
    revalidatePath(`/magic-items/${itemId}`);
    return { success: true, data: updated };
  } catch (caught) {
    console.error("Failed to update magic item", caught);
    return {
      success: false,
      message: "Failed to update magic item. Please try again.",
    };
  }

  return { success: true };
}

export async function deleteMagicItemAction(
  _: MagicItemFormState | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const idValue = formData.get("id");
  const itemId =
    typeof idValue === "string" ? Number.parseInt(idValue, 10) : Number.NaN;

  if (!Number.isFinite(itemId)) {
    return {
      success: false,
      message: "Invalid magic item identifier.",
    };
  }

  try {
    // Check if this is a manual or wiki item
    const [manualItem] = await db
      .select({ id: magicItems.id })
      .from(magicItems)
      .where(eq(magicItems.id, itemId))
      .limit(1);

    if (manualItem) {
      // Delete manual item
      await deleteMagicItem(itemId);
    } else {
      // Check if it's a wiki item
      const [wikiItem] = await db
        .select({ id: wikiArticles.id })
        .from(wikiArticles)
        .where(
          and(
            eq(wikiArticles.id, itemId),
            eq(wikiArticles.contentType, "magic-item"),
          ),
        )
        .limit(1);

      if (wikiItem) {
        // Delete wiki item assignments and the wiki article
        await db
          .delete(wikiArticleEntities)
          .where(eq(wikiArticleEntities.wikiArticleId, itemId));
        await db.delete(wikiArticles).where(eq(wikiArticles.id, itemId));
      } else {
        return {
          success: false,
          message: "Magic item not found.",
        };
      }
    }

    revalidatePath("/magic-items");
    return { success: true };
  } catch (caught) {
    console.error("Failed to delete magic item", caught);
    return {
      success: false,
      message: "Failed to delete magic item. Please try again.",
    };
  }
}

// Helper function to sanitize magic item data
function sanitizeMagicItem(item: MagicItem): MagicItem {
  return {
    ...item,
    name: typeof item.name === "string" ? item.name : `Magic Item ${item.id}`,
    rarity: typeof item.rarity === "string" ? item.rarity : null,
    type: typeof item.type === "string" ? item.type : null,
    description: typeof item.description === "string" ? item.description : null,
    attunementRequired:
      typeof item.attunementRequired === "boolean"
        ? item.attunementRequired
        : null,
  };
}

// Helper function to sanitize assignment data
function sanitizeAssignment(
  assignment: MagicItemAssignmentDetail,
): MagicItemAssignmentDetail {
  return {
    ...assignment,
    entityName:
      typeof assignment.entityName === "string"
        ? assignment.entityName
        : "Unknown",
    entityDescription:
      typeof assignment.entityDescription === "string"
        ? assignment.entityDescription
        : null,
    campaignTitle:
      typeof assignment.campaignTitle === "string"
        ? assignment.campaignTitle
        : null,
    source: typeof assignment.source === "string" ? assignment.source : null,
    notes: typeof assignment.notes === "string" ? assignment.notes : null,
  };
}
