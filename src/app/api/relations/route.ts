import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { relations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { RelationSchema, validateRequestBody } from "@/lib/validation/schemas";

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
    const validation = validateRequestBody(RelationSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const validatedData = validation.data;

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
        { success: false, error: "Relation already exists" },
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

    return NextResponse.json({ success: true, data: newRelation }, { status: 201 });
  } catch (error) {
    console.error("Error creating relation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create relation" },
      { status: 500 }
    );
  }
}