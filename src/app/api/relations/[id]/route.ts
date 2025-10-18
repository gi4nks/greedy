import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { relations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a relation
const updateRelationSchema = z.object({
  relationType: z.string().min(1).optional(),
  description: z.string().optional(),
  bidirectional: z.boolean().optional(),
  metadata: z.any().optional(),
});

// GET /api/relations/[id] - Get a specific relation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const relationId = parseInt(resolvedParams.id);

    if (isNaN(relationId)) {
      return NextResponse.json(
        { error: "Invalid relation ID" },
        { status: 400 }
      );
    }

    const [relation] = await db
      .select()
      .from(relations)
      .where(eq(relations.id, relationId))
      .limit(1);

    if (!relation) {
      return NextResponse.json(
        { error: "Relation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(relation);
  } catch (error) {
    console.error("Error fetching relation:", error);
    return NextResponse.json(
      { error: "Failed to fetch relation" },
      { status: 500 }
    );
  }
}

// PUT /api/relations/[id] - Update a relation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const relationId = parseInt(resolvedParams.id);

    if (isNaN(relationId)) {
      return NextResponse.json(
        { error: "Invalid relation ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateRelationSchema.parse(body);

    // Check if relation exists
    const [existingRelation] = await db
      .select()
      .from(relations)
      .where(eq(relations.id, relationId))
      .limit(1);

    if (!existingRelation) {
      return NextResponse.json(
        { error: "Relation not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (validatedData.relationType !== undefined) {
      updateData.relationType = validatedData.relationType;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.bidirectional !== undefined) {
      updateData.bidirectional = validatedData.bidirectional;
    }
    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata ? JSON.stringify(validatedData.metadata) : null;
    }

    const [updatedRelation] = await db
      .update(relations)
      .set(updateData)
      .where(eq(relations.id, relationId))
      .returning();

    return NextResponse.json(updatedRelation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating relation:", error);
    return NextResponse.json(
      { error: "Failed to update relation" },
      { status: 500 }
    );
  }
}

// DELETE /api/relations/[id] - Delete a relation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const relationId = parseInt(resolvedParams.id);

    if (isNaN(relationId)) {
      return NextResponse.json(
        { error: "Invalid relation ID" },
        { status: 400 }
      );
    }

    // Check if relation exists
    const [existingRelation] = await db
      .select()
      .from(relations)
      .where(eq(relations.id, relationId))
      .limit(1);

    if (!existingRelation) {
      return NextResponse.json(
        { error: "Relation not found" },
        { status: 404 }
      );
    }

    await db
      .delete(relations)
      .where(eq(relations.id, relationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting relation:", error);
    return NextResponse.json(
      { error: "Failed to delete relation" },
      { status: 500 }
    );
  }
}