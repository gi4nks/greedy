"use server";

import { db } from "@/lib/db";
import { relations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { RelationSchema } from "@/lib/validation/schemas";

export async function createRelationship(
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const rawValues = {
    campaignId: (formData.get("campaignId") as string | null) ?? "",
    sourceEntityType: (formData.get("sourceEntityType") as string | null) ?? "",
    sourceEntityId: (formData.get("sourceEntityId") as string | null) ?? "",
    targetEntityType: (formData.get("targetEntityType") as string | null) ?? "",
    targetEntityId: (formData.get("targetEntityId") as string | null) ?? "",
    relationType: (formData.get("relationType") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    bidirectional: formData.get("bidirectional") === "on",
    metadata: (formData.get("metadata") as string | null) ?? "",
  };

  const normalized = {
    campaignId: rawValues.campaignId ? Number.parseInt(rawValues.campaignId, 10) : 0,
    sourceEntityType: rawValues.sourceEntityType,
    sourceEntityId: rawValues.sourceEntityId ? Number.parseInt(rawValues.sourceEntityId, 10) : 0,
    targetEntityType: rawValues.targetEntityType,
    targetEntityId: rawValues.targetEntityId ? Number.parseInt(rawValues.targetEntityId, 10) : 0,
    relationType: rawValues.relationType.trim(),
    description: rawValues.description.trim() || undefined,
    bidirectional: rawValues.bidirectional,
    metadata: rawValues.metadata.trim() ? JSON.parse(rawValues.metadata) : undefined,
  };

  const parsed = RelationSchema.safeParse(normalized);

  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation failed";
    return { success: false, error: errorMessage };
  }

  try {
    // Check if relation already exists (prevent duplicates)
    const existingRelation = await db
      .select()
      .from(relations)
      .where(
        and(
          eq(relations.campaignId, parsed.data.campaignId),
          eq(relations.sourceEntityType, parsed.data.sourceEntityType),
          eq(relations.sourceEntityId, parsed.data.sourceEntityId),
          eq(relations.targetEntityType, parsed.data.targetEntityType),
          eq(relations.targetEntityId, parsed.data.targetEntityId),
          eq(relations.relationType, parsed.data.relationType)
        )
      )
      .limit(1);

    if (existingRelation.length > 0) {
      return { success: false, error: "Relation already exists" };
    }

    const [newRelation] = await db
      .insert(relations)
      .values({
        campaignId: parsed.data.campaignId,
        sourceEntityType: parsed.data.sourceEntityType,
        sourceEntityId: parsed.data.sourceEntityId,
        targetEntityType: parsed.data.targetEntityType,
        targetEntityId: parsed.data.targetEntityId,
        relationType: parsed.data.relationType,
        description: parsed.data.description,
        bidirectional: parsed.data.bidirectional,
        metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .returning();

    revalidatePath("/relationships");
    return { success: true, data: newRelation };
  } catch (error) {
    console.error("Failed to create relationship", error);
    return {
      success: false,
      error: "Failed to create relationship. Please try again.",
    };
  }
}

export async function updateRelationship(
  relationshipId: number,
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const rawValues = {
    campaignId: (formData.get("campaignId") as string | null) ?? "",
    sourceEntityType: (formData.get("sourceEntityType") as string | null) ?? "",
    sourceEntityId: (formData.get("sourceEntityId") as string | null) ?? "",
    targetEntityType: (formData.get("targetEntityType") as string | null) ?? "",
    targetEntityId: (formData.get("targetEntityId") as string | null) ?? "",
    relationType: (formData.get("relationType") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    bidirectional: formData.get("bidirectional") === "on",
    metadata: (formData.get("metadata") as string | null) ?? "",
  };

  const normalized = {
    campaignId: rawValues.campaignId ? Number.parseInt(rawValues.campaignId, 10) : 0,
    sourceEntityType: rawValues.sourceEntityType,
    sourceEntityId: rawValues.sourceEntityId ? Number.parseInt(rawValues.sourceEntityId, 10) : 0,
    targetEntityType: rawValues.targetEntityType,
    targetEntityId: rawValues.targetEntityId ? Number.parseInt(rawValues.targetEntityId, 10) : 0,
    relationType: rawValues.relationType.trim(),
    description: rawValues.description.trim() || undefined,
    bidirectional: rawValues.bidirectional,
    metadata: rawValues.metadata.trim() ? JSON.parse(rawValues.metadata) : undefined,
  };

  const parsed = RelationSchema.safeParse(normalized);

  if (!parsed.success) {
    const errorMessage = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation failed";
    return { success: false, error: errorMessage };
  }

  try {
    const [updated] = await db
      .update(relations)
      .set({
        campaignId: parsed.data.campaignId,
        sourceEntityType: parsed.data.sourceEntityType,
        sourceEntityId: parsed.data.sourceEntityId,
        targetEntityType: parsed.data.targetEntityType,
        targetEntityId: parsed.data.targetEntityId,
        relationType: parsed.data.relationType,
        description: parsed.data.description,
        bidirectional: parsed.data.bidirectional,
        metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(relations.id, relationshipId))
      .returning();

    if (!updated) {
      return { success: false, error: "Relationship not found or could not be updated." };
    }

    revalidatePath("/relationships");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update relationship", error);
    return {
      success: false,
      error: "Failed to update relationship. Please try again.",
    };
  }
}

export async function deleteRelationship(
  relationshipId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(relations)
      .where(eq(relations.id, relationshipId));

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