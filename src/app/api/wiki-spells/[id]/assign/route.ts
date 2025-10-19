import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiArticleEntities } from "@/lib/db/schema";

// POST /api/wiki-spells/[id]/assign - Assign wiki spell to entities
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const spellId = parseInt(id);
    const {
      characterIds,
      isPrepared = false,
      isKnown = true,
    } = await request.json();

    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return NextResponse.json(
        { error: "Character IDs must be a non-empty array" },
        { status: 400 },
      );
    }

    // Insert assignments for each character
    const assignments = characterIds.map((characterId) => ({
      wikiArticleId: spellId,
      entityType: "character",
      entityId: characterId,
      relationshipType: "prepared",
      relationshipData: { isPrepared, isKnown },
    }));

    const results = await db
      .insert(wikiArticleEntities)
      .values(assignments)
      .returning();

    return NextResponse.json({
      message: "Wiki spell assigned successfully",
      assignments: results,
    });
  } catch (error) {
    console.error("Error assigning wiki spell:", error);
    return NextResponse.json(
      { error: "Failed to assign wiki spell" },
      { status: 500 },
    );
  }
}
