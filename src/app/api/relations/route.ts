import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { relations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a relation
const createRelationSchema = z.object({
  campaignId: z.number(),
  sourceEntityType: z.enum(["character", "npc", "location", "quest", "adventure", "session"]),
  sourceEntityId: z.number(),
  targetEntityType: z.enum(["character", "npc", "location", "quest", "adventure", "session"]),
  targetEntityId: z.number(),
  relationType: z.string().min(1),
  description: z.string().optional(),
  bidirectional: z.boolean().optional().default(false),
  metadata: z.any().optional(),
});

// GET /api/relations?campaignId=X - List all relations for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    const campaignRelations = await db
      .select()
      .from(relations)
      .where(eq(relations.campaignId, parseInt(campaignId)))
      .orderBy(relations.createdAt);

    return NextResponse.json(campaignRelations);
  } catch (error) {
    console.error("Error fetching relations:", error);
    return NextResponse.json(
      { error: "Failed to fetch relations" },
      { status: 500 }
    );
  }
}

// POST /api/relations - Create a new relation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRelationSchema.parse(body);

    // Check if relation already exists (prevent duplicates)
    const existingRelation = await db
      .select()
      .from(relations)
      .where(
        and(
          eq(relations.campaignId, validatedData.campaignId),
          eq(relations.sourceEntityType, validatedData.sourceEntityType),
          eq(relations.sourceEntityId, validatedData.sourceEntityId),
          eq(relations.targetEntityType, validatedData.targetEntityType),
          eq(relations.targetEntityId, validatedData.targetEntityId),
          eq(relations.relationType, validatedData.relationType)
        )
      )
      .limit(1);

    if (existingRelation.length > 0) {
      return NextResponse.json(
        { error: "Relation already exists" },
        { status: 409 }
      );
    }

    const [newRelation] = await db
      .insert(relations)
      .values({
        campaignId: validatedData.campaignId,
        sourceEntityType: validatedData.sourceEntityType,
        sourceEntityId: validatedData.sourceEntityId,
        targetEntityType: validatedData.targetEntityType,
        targetEntityId: validatedData.targetEntityId,
        relationType: validatedData.relationType,
        description: validatedData.description,
        bidirectional: validatedData.bidirectional,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      })
      .returning();

    return NextResponse.json(newRelation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating relation:", error);
    return NextResponse.json(
      { error: "Failed to create relation" },
      { status: 500 }
    );
  }
}