"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { relations, characters, npcs } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";
import { relationshipSchema, type RelationshipFormData } from "@/lib/validation";
import { validateFormData } from "@/lib/validation";

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
};

export async function getEntityRelationships(entityId: string, entityType: string, campaignId?: number) {
  try {
    const whereConditions = [
      or(
        and(
          eq(relations.sourceEntityType, entityType),
          eq(relations.sourceEntityId, parseInt(entityId))
        ),
        and(
          eq(relations.targetEntityType, entityType),
          eq(relations.targetEntityId, parseInt(entityId))
        )
      )
    ];

    if (campaignId) {
      whereConditions.push(eq(relations.campaignId, campaignId));
    }

    // First get the relations
    const entityRelations = await db
      .select()
      .from(relations)
      .where(and(...whereConditions))
      .orderBy(relations.createdAt);

    // Then enrich with names
    const enrichedRelations = await Promise.all(
      entityRelations.map(async (relation) => {
        // Determine which entity is the "other" one (not the current entity)
        const isSourceCurrent = relation.sourceEntityType === entityType && relation.sourceEntityId === parseInt(entityId);
        const otherEntityType = isSourceCurrent ? relation.targetEntityType : relation.sourceEntityType;
        const otherEntityId = isSourceCurrent ? relation.targetEntityId : relation.sourceEntityId;

        // Get the actual name based on entity type
        let otherEntityName = "";
        if (otherEntityType === "character") {
          const character = await db
            .select({ name: characters.name })
            .from(characters)
            .where(eq(characters.id, otherEntityId))
            .limit(1);
          otherEntityName = character[0]?.name || `Character ${otherEntityId}`;
        } else if (otherEntityType === "npc") {
          const npc = await db
            .select({ name: npcs.name })
            .from(npcs)
            .where(eq(npcs.id, otherEntityId))
            .limit(1);
          otherEntityName = npc[0]?.name || `NPC ${otherEntityId}`;
        } else {
          otherEntityName = `${otherEntityType} ${otherEntityId}`;
        }

        // Parse metadata
        let metadata: RelationshipMetadata;
        try {
          if (relation.metadata) {
            metadata = JSON.parse(relation.metadata as string) as RelationshipMetadata;
          } else {
            metadata = DEFAULT_RELATIONSHIP_METADATA;
          }
        } catch (error) {
          console.warn("Failed to parse relationship metadata:", error);
          metadata = DEFAULT_RELATIONSHIP_METADATA;
        }

        return {
          id: relation.id,
          npcId: otherEntityType === "character" ? otherEntityId : parseInt(entityId),
          characterId: otherEntityType === "character" ? otherEntityId : (otherEntityType === "npc" ? otherEntityId : 0),
          relationshipType: relation.relationType,
          strength: metadata.strength || 50,
          trust: metadata.trust || 50,
          fear: metadata.fear || 0,
          respect: metadata.respect || 50,
          notes: relation.description || "",
          npc_name: otherEntityName,
          npc_type: otherEntityType,
          target_name: entityType === "character" ? `Character ${entityId}` : `${entityType} ${entityId}`,
          target_type: entityType,
          createdAt: relation.createdAt || "",
          updatedAt: relation.updatedAt || "",
        };
      })
    );

    return enrichedRelations;
  } catch (error) {
    console.error("Error fetching entity relationships:", error);
    return [];
  }
}

export async function createRelationship(
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    // Extract form data
    const rawData = {
      npcId: formData.get("npcId") as string,
      characterId: formData.get("characterId") as string,
      relationshipType: formData.get("relationshipType") as string,
      strength: parseInt(formData.get("strength") as string) || 50,
      trust: parseInt(formData.get("trust") as string) || 50,
      fear: parseInt(formData.get("fear") as string) || 0,
      respect: parseInt(formData.get("respect") as string) || 50,
      description: formData.get("description") as string || "",
      isMutual: formData.get("isMutual") === "true",
      discoveredByPlayers: formData.get("discoveredByPlayers") === "true",
    };

    // Validate with Zod schema
    const validationResult = validateFormData(relationshipSchema, rawData);
    if (!validationResult.success) {
      return {
        success: false,
        error: Object.values(validationResult.errors!)[0] || "Validation failed"
      };
    }

    const validatedData = validationResult.data;

    // Create relationship in database using generic relations table
    const [newRelationship] = await db
      .insert(relations)
      .values({
        campaignId: 1, // TODO: Get from context or form
        sourceEntityType: "npc",
        sourceEntityId: parseInt(validatedData.npcId),
        targetEntityType: "character",
        targetEntityId: parseInt(validatedData.characterId),
        relationType: validatedData.relationshipType,
        description: validatedData.description,
        bidirectional: validatedData.isMutual,
        metadata: JSON.stringify({
          strength: validatedData.strength,
          trust: validatedData.trust,
          fear: validatedData.fear,
          respect: validatedData.respect,
          discoveredByPlayers: validatedData.discoveredByPlayers,
        }),
      })
      .returning();

    revalidatePath("/relationships");
    return { success: true, data: newRelationship };
  } catch (error) {
    console.error("Error creating relationship:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create relationship"
    };
  }
}

export async function updateRelationship(
  relationshipId: number,
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    // Extract form data
    const rawData = {
      npcId: formData.get("npcId") as string,
      characterId: formData.get("characterId") as string,
      relationshipType: formData.get("relationshipType") as string,
      strength: parseInt(formData.get("strength") as string) || 50,
      trust: parseInt(formData.get("trust") as string) || 50,
      fear: parseInt(formData.get("fear") as string) || 0,
      respect: parseInt(formData.get("respect") as string) || 50,
      description: formData.get("description") as string || "",
      isMutual: formData.get("isMutual") === "true",
      discoveredByPlayers: formData.get("discoveredByPlayers") === "true",
    };

    // Validate with Zod schema
    const validationResult = validateFormData(relationshipSchema, rawData);
    if (!validationResult.success) {
      return {
        success: false,
        error: Object.values(validationResult.errors!)[0] || "Validation failed"
      };
    }

    const validatedData = validationResult.data;

    // Update relationship in database
    const [updatedRelationship] = await db
      .update(relations)
      .set({
        campaignId: 1, // TODO: Get from context or form
        sourceEntityType: "npc",
        sourceEntityId: parseInt(validatedData.npcId),
        targetEntityType: "character",
        targetEntityId: parseInt(validatedData.characterId),
        relationType: validatedData.relationshipType,
        description: validatedData.description,
        bidirectional: validatedData.isMutual,
        metadata: JSON.stringify({
          strength: validatedData.strength,
          trust: validatedData.trust,
          fear: validatedData.fear,
          respect: validatedData.respect,
          discoveredByPlayers: validatedData.discoveredByPlayers,
        }),
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
      error: error instanceof Error ? error.message : "Failed to update relationship"
    };
  }
}