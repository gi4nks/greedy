import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiArticleEntities } from "@/lib/db/schema";

// POST /api/wiki-monsters/[id]/assign - Assign wiki monster to entities
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const monsterId = parseInt(id);
    const {
      characterIds,
      relationshipType = "companion",
      notes = "",
    } = await request.json();

    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return NextResponse.json(
        { error: "Character IDs must be a non-empty array" },
        { status: 400 },
      );
    }

    // Insert assignments for each character
    const assignments = characterIds.map((characterId) => ({
      wikiArticleId: monsterId,
      entityType: "character",
      entityId: characterId,
      relationshipType,
      relationshipData: notes ? { notes } : {},
    }));

    const results = await db
      .insert(wikiArticleEntities)
      .values(assignments)
      .returning();

    return NextResponse.json({
      message: "Wiki monster assigned successfully",
      assignments: results,
    });
  } catch (error) {
    console.error("Error assigning wiki monster:", error);
    return NextResponse.json(
      { error: "Failed to assign wiki monster" },
      { status: 500 },
    );
  }
}
