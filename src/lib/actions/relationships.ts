"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  relations,
  characters,
  npcs,
  locations,
  quests,
  adventures,
} from "@/lib/db/schema";
import {
  and,
  eq,
  inArray,
  ne,
  or,
} from "drizzle-orm";
import { formatSqlTimestamp, parseBooleanField, parseJsonField, parseNumberField, parseStringField } from "@/lib/utils/form-data";
import { formatZodErrors } from "@/lib/validation";
import { RelationSchema } from "@/lib/validation/schemas";
import { relationshipSchema } from "@/lib/validation/relationship";
import { z } from "zod";

type RelationshipMetadata = {
  strength?: number;
  trust?: number;
  fear?: number;
  respect?: number;
  discoveredByPlayers?: boolean;
};

const DEFAULT_RELATIONSHIP_METADATA: RelationshipMetadata = {
  strength: 50,
  trust: 50,
  fear: 0,
  respect: 50,
  discoveredByPlayers: false,
};

const RelationActionSchema = RelationSchema.partial({ campaignId: true });
type RelationActionInput = z.infer<typeof RelationActionSchema>;

type RelationshipEntityType = "character" | "npc" | "location" | "quest";

export async function getEntityRelationships(
  entityId: string,
  entityType: string,
  campaignId?: number,
) {
  try {
    const entityNumericId = Number.parseInt(entityId, 10);
    const baseCondition = or(
      and(
        eq(relations.sourceEntityType, entityType),
        eq(relations.sourceEntityId, entityNumericId),
      ),
      and(
        eq(relations.targetEntityType, entityType),
        eq(relations.targetEntityId, entityNumericId),
      ),
    );

    const whereClause = campaignId
      ? and(baseCondition, eq(relations.campaignId, campaignId))
      : baseCondition;

    const entityRelations = await db
      .select()
      .from(relations)
      .where(whereClause)
      .orderBy(relations.createdAt);

    if (entityRelations.length === 0) {
      return [];
    }

    const entityBuckets: Record<string, Set<number>> = {};
    for (const relation of entityRelations) {
      if (!entityBuckets[relation.sourceEntityType]) {
        entityBuckets[relation.sourceEntityType] = new Set();
      }
      entityBuckets[relation.sourceEntityType].add(relation.sourceEntityId);

      if (!entityBuckets[relation.targetEntityType]) {
        entityBuckets[relation.targetEntityType] = new Set();
      }
      entityBuckets[relation.targetEntityType].add(relation.targetEntityId);
    }

    const nameLookups = new Map<
      string,
      Map<number, string>
    >();

    await Promise.all(
      Object.entries(entityBuckets).map(async ([type, ids]) => {
        const lookup = await fetchEntityNames(
          type as RelationshipEntityType,
          Array.from(ids),
        );
        nameLookups.set(type, lookup);
      }),
    );

    return entityRelations.map((relation) => {
      const isSourceCurrent =
        relation.sourceEntityType === entityType &&
        relation.sourceEntityId === entityNumericId;
      const otherEntityType = isSourceCurrent
        ? relation.targetEntityType
        : relation.sourceEntityType;
      const otherEntityId = isSourceCurrent
        ? relation.targetEntityId
        : relation.sourceEntityId;

      const otherEntityName =
        nameLookups.get(otherEntityType)?.get(otherEntityId) ??
        `${otherEntityType} ${otherEntityId}`;

      const currentEntityName =
        nameLookups.get(entityType)?.get(entityNumericId) ??
        `${entityType} ${entityNumericId}`;

      const metadata = parseRelationshipMetadata(relation.metadata);

      return {
        id: relation.id,
        npcId: otherEntityType === "character" ? otherEntityId : entityNumericId,
        characterId: otherEntityType === "character"
          ? otherEntityId
          : otherEntityType === "npc"
            ? otherEntityId
            : 0,
        relationshipType: relation.relationType,
        strength: metadata.strength ?? DEFAULT_RELATIONSHIP_METADATA.strength!,
        trust: metadata.trust ?? DEFAULT_RELATIONSHIP_METADATA.trust!,
        fear: metadata.fear ?? DEFAULT_RELATIONSHIP_METADATA.fear!,
        respect: metadata.respect ?? DEFAULT_RELATIONSHIP_METADATA.respect!,
        notes: relation.description || "",
        npc_name: otherEntityName,
        npc_type: otherEntityType,
        target_name: currentEntityName,
        target_type: entityType,
        createdAt: relation.createdAt || "",
        updatedAt: relation.updatedAt || "",
      };
    });
  } catch (error) {
    console.error("Error fetching entity relationships:", error);
    return [];
  }
}

export async function createRelationship(
  prevState: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const parsed = buildRelationPayload(formData);
  if (!parsed.success) {
    const errors = formatZodErrors(parsed.error);
    return {
      success: false,
      error: Object.values(errors)[0] ?? "Validation failed",
    };
  }

  try {
    const campaignId = await ensureCampaignId(parsed.data);
    if (!campaignId) {
      return {
        success: false,
        error: "Campaign could not be determined for this relationship.",
      };
    }

    const relationData = { ...parsed.data, campaignId };

    const existing = await findExistingRelation(relationData);
    if (existing) {
      return { success: false, error: "Relation already exists." };
    }

    const now = formatSqlTimestamp();
    const [newRelationship] = await db
      .insert(relations)
      .values({
        campaignId: relationData.campaignId,
        sourceEntityType: relationData.sourceEntityType,
        sourceEntityId: relationData.sourceEntityId,
        targetEntityType: relationData.targetEntityType,
        targetEntityId: relationData.targetEntityId,
        relationType: relationData.relationType,
        description: relationData.description ?? null,
        bidirectional: relationData.bidirectional ?? false,
        metadata: serializeMetadata(relationData.metadata),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/relationships");
    return { success: true, data: newRelationship };
  } catch (error) {
    console.error("Error creating relationship:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create relationship",
    };
  }
}

export async function updateRelationship(
  relationshipId: number,
  prevState: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const parsed = buildRelationPayload(formData);
  if (!parsed.success) {
    const errors = formatZodErrors(parsed.error);
    return {
      success: false,
      error: Object.values(errors)[0] ?? "Validation failed",
    };
  }

  try {
    const campaignId = await ensureCampaignId(parsed.data);
    if (!campaignId) {
      return {
        success: false,
        error: "Campaign could not be determined for this relationship.",
      };
    }

    const relationData = { ...parsed.data, campaignId };
    const existing = await findExistingRelation(relationData, relationshipId);
    if (existing) {
      return { success: false, error: "Another relation with these entities already exists." };
    }

    const now = formatSqlTimestamp();
    const [updatedRelationship] = await db
      .update(relations)
      .set({
        campaignId: relationData.campaignId,
        sourceEntityType: relationData.sourceEntityType,
        sourceEntityId: relationData.sourceEntityId,
        targetEntityType: relationData.targetEntityType,
        targetEntityId: relationData.targetEntityId,
        relationType: relationData.relationType,
        description: relationData.description ?? null,
        bidirectional: relationData.bidirectional ?? false,
        metadata: serializeMetadata(relationData.metadata),
        updatedAt: now,
      })
      .where(eq(relations.id, relationshipId))
      .returning();

    if (!updatedRelationship) {
      return { success: false, error: "Relationship not found" };
    }

    revalidatePath("/relationships");
    return { success: true, data: updatedRelationship };
  } catch (error) {
    console.error("Error updating relationship:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update relationship",
    };
  }
}

export async function deleteRelationship(
  relationshipId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(relations).where(eq(relations.id, relationshipId));

    revalidatePath("/relationships");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete relationship", error);
    return {
      success: false,
      error: "Failed to delete relationship. Please try again.",
    };
  }
}

function buildRelationPayload(formData: FormData) {
  const metadataOverride = parseJsonField<Partial<RelationshipMetadata>>(
    formData.get("metadata"),
    {},
  );

  const metadataFromControls: Partial<RelationshipMetadata> = {
    strength: parseNumberField(formData.get("strength")),
    trust: parseNumberField(formData.get("trust")),
    fear: parseNumberField(formData.get("fear")),
    respect: parseNumberField(formData.get("respect")),
    discoveredByPlayers: formData.has("discoveredByPlayers")
      ? parseBooleanField(formData.get("discoveredByPlayers"))
      : undefined,
  };

  const specializedResult = parseNpcCharacterRelationship(
    formData,
    metadataFromControls,
  );
  if (specializedResult) {
    return specializedResult;
  }

  const metadata = mergeMetadata(metadataOverride, metadataFromControls);
  const payload = buildGenericRelationPayload(formData, metadata);
  return validateRelationPayload(payload);
}

function parseNpcCharacterRelationship(
  formData: FormData,
  metrics: Partial<RelationshipMetadata>,
): RelationParseResult | null {
  if (!formData.has("npcId") && !formData.has("characterId")) {
    return null;
  }

  const relationshipPayload = {
    npcId: parseNumberField(formData.get("npcId")) ?? 0,
    characterId: parseNumberField(formData.get("characterId")) ?? 0,
    relationshipType:
      parseStringField(formData.get("relationshipType"), {
        emptyAsUndefined: false,
      }) ?? "",
    strength: metrics.strength ?? DEFAULT_RELATIONSHIP_METADATA.strength!,
    trust: metrics.trust ?? DEFAULT_RELATIONSHIP_METADATA.trust!,
    fear: metrics.fear ?? DEFAULT_RELATIONSHIP_METADATA.fear!,
    respect: metrics.respect ?? DEFAULT_RELATIONSHIP_METADATA.respect!,
    description:
      parseStringField(formData.get("description"), {
        emptyAsUndefined: false,
      }) ?? "",
    isMutual: parseBooleanField(formData.get("isMutual")),
    discoveredByPlayers:
      metrics.discoveredByPlayers ??
      DEFAULT_RELATIONSHIP_METADATA.discoveredByPlayers!,
  };

  const result = relationshipSchema.safeParse(relationshipPayload);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const payload = {
    campaignId: parseNumberField(formData.get("campaignId")),
    sourceEntityType: "npc" as const,
    sourceEntityId: result.data.npcId,
    targetEntityType: "character" as const,
    targetEntityId: result.data.characterId,
    relationType: result.data.relationshipType,
    description: result.data.description || undefined,
    bidirectional: result.data.isMutual,
    metadata: {
      strength: result.data.strength,
      trust: result.data.trust,
      fear: result.data.fear,
      respect: result.data.respect,
      discoveredByPlayers: result.data.discoveredByPlayers,
    },
  };

  return validateRelationPayload(payload);
}

function buildGenericRelationPayload(
  formData: FormData,
  metadata: RelationshipMetadata,
) {
  return {
    campaignId: parseNumberField(formData.get("campaignId")),
    sourceEntityType:
      parseStringField(formData.get("sourceEntityType"), {
        emptyAsUndefined: false,
      }) || "npc",
    sourceEntityId:
      parseNumberField(formData.get("sourceEntityId")) ??
      parseNumberField(formData.get("npcId")),
    targetEntityType:
      parseStringField(formData.get("targetEntityType"), {
        emptyAsUndefined: false,
      }) || "character",
    targetEntityId:
      parseNumberField(formData.get("targetEntityId")) ??
      parseNumberField(formData.get("characterId")),
    relationType:
      parseStringField(formData.get("relationType"), {
        emptyAsUndefined: false,
      }) ||
      parseStringField(formData.get("relationshipType"), {
        emptyAsUndefined: false,
      }) ||
      "",
    description: parseStringField(formData.get("description"), {
      emptyAsUndefined: false,
    }),
    bidirectional:
      parseBooleanField(formData.get("bidirectional")) ??
      parseBooleanField(formData.get("isMutual")),
    metadata,
  };
}

function mergeMetadata(
  override: RelationshipMetadata | undefined,
  controls: Partial<RelationshipMetadata>,
): RelationshipMetadata {
  return {
    ...DEFAULT_RELATIONSHIP_METADATA,
    ...(override ?? {}),
    ...Object.fromEntries(
      Object.entries(controls).filter(([, value]) => value !== undefined),
    ),
  };
}

function validateRelationPayload(
  payload: Record<string, unknown>,
): RelationParseResult {
  const result = RelationActionSchema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

function serializeMetadata(metadata?: RelationshipMetadata) {
  if (!metadata) {
    return null;
  }

  return JSON.stringify(metadata);
}

function parseRelationshipMetadata(payload: unknown): RelationshipMetadata {
  if (!payload) {
    return DEFAULT_RELATIONSHIP_METADATA;
  }

  try {
    if (typeof payload === "string") {
      return {
        ...DEFAULT_RELATIONSHIP_METADATA,
        ...(JSON.parse(payload) as RelationshipMetadata),
      };
    }

    return {
      ...DEFAULT_RELATIONSHIP_METADATA,
      ...(payload as RelationshipMetadata),
    };
  } catch (error) {
    console.warn("Failed to parse relationship metadata:", error);
    return DEFAULT_RELATIONSHIP_METADATA;
  }
}

async function ensureCampaignId(payload: RelationActionInput) {
  if (payload.campaignId) {
    return payload.campaignId;
  }

  return resolveCampaignId(payload.sourceEntityType, payload.sourceEntityId);
}

async function resolveCampaignId(
  entityType: string,
  entityId?: number,
): Promise<number | undefined> {
  if (!entityId) {
    return undefined;
  }

  if (entityType === "npc" || entityType === "character") {
    const [record] = await db
      .select({ campaignId: characters.campaignId })
      .from(characters)
      .where(eq(characters.id, entityId))
      .limit(1);
    return record?.campaignId ?? undefined;
  }

  if (entityType === "location") {
    const [record] = await db
      .select({ campaignId: locations.campaignId })
      .from(locations)
      .where(eq(locations.id, entityId))
      .limit(1);
    return record?.campaignId ?? undefined;
  }

  if (entityType === "quest") {
    const [record] = await db
      .select({ campaignId: adventures.campaignId })
      .from(quests)
      .innerJoin(adventures, eq(quests.adventureId, adventures.id))
      .where(eq(quests.id, entityId))
      .limit(1);
    return record?.campaignId ?? undefined;
  }

  return undefined;
}

async function findExistingRelation(
  data: RelationActionInput & { campaignId: number },
  excludeId?: number,
) {
  const baseClause = and(
    eq(relations.campaignId, data.campaignId),
    eq(relations.sourceEntityType, data.sourceEntityType),
    eq(relations.sourceEntityId, data.sourceEntityId),
    eq(relations.targetEntityType, data.targetEntityType),
    eq(relations.targetEntityId, data.targetEntityId),
    eq(relations.relationType, data.relationType),
  );

  const whereClause = excludeId
    ? and(baseClause, ne(relations.id, excludeId))
    : baseClause;

  const [existing] = await db
    .select({ id: relations.id })
    .from(relations)
    .where(whereClause)
    .limit(1);

  return existing;
}

async function fetchEntityNames(
  entityType: RelationshipEntityType,
  ids: number[],
) {
  if (!ids.length) {
    return new Map<number, string>();
  }

  if (entityType === "character") {
    const rows = await db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(inArray(characters.id, ids));
    return new Map(rows.map((row) => [row.id, row.name || `Character ${row.id}`]));
  }

  if (entityType === "npc") {
    const nameMap = new Map<number, string>();
    const characterRows = await db
      .select({ id: characters.id, name: characters.name })
      .from(characters)
      .where(inArray(characters.id, ids));
    characterRows.forEach((row) => {
      if (row.name) {
        nameMap.set(row.id, row.name);
      }
    });

    const missing = ids.filter((id) => !nameMap.has(id));
    if (missing.length) {
      const npcRows = await db
        .select({ id: npcs.id, name: npcs.name })
        .from(npcs)
        .where(inArray(npcs.id, missing));
      npcRows.forEach((row) => {
        nameMap.set(row.id, row.name || `NPC ${row.id}`);
      });
    }

    return nameMap;
  }

  if (entityType === "location") {
    const rows = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(inArray(locations.id, ids));
    return new Map(
      rows.map((row) => [row.id, row.name || `Location ${row.id}`]),
    );
  }

  if (entityType === "quest") {
    const rows = await db
      .select({ id: quests.id, title: quests.title })
      .from(quests)
      .where(inArray(quests.id, ids));
    return new Map(
      rows.map((row) => [row.id, row.title || `Quest ${row.id}`]),
    );
  }

  return new Map<number, string>();
}
