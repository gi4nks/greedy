import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  characters,
  magicItems,
  magicItemAssignments,
  wikiArticleEntities,
  wikiArticles,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

// GET /api/characters/[id] - Get character with all assigned entities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);

    // Get character basic info
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId));

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Get assigned magic items
    const magicItemsResult = await db
      .select({
        id: magicItems.id,
        assignmentId: magicItemAssignments.id,
        name: magicItems.name,
        rarity: magicItems.rarity,
        type: magicItems.type,
        description: magicItems.description,
        source: magicItemAssignments.source,
        notes: magicItemAssignments.notes,
        metadata: magicItemAssignments.metadata,
        assignedAt: magicItemAssignments.assignedAt,
        campaignId: magicItemAssignments.campaignId,
      })
      .from(magicItemAssignments)
      .innerJoin(
        magicItems,
        eq(magicItemAssignments.magicItemId, magicItems.id),
      )
      .where(
        and(
          eq(magicItemAssignments.entityType, "character"),
          eq(magicItemAssignments.entityId, characterId),
        ),
      );

    // Get assigned wiki entities from unified tables
    const wikiEntitiesResult = await db
      .select({
        id: wikiArticles.id,
        title: wikiArticles.title,
        contentType: wikiArticles.contentType,
        wikiUrl: wikiArticles.wikiUrl,
        description: wikiArticles.rawContent, // Map rawContent to description for frontend compatibility
        parsedData: wikiArticles.parsedData,
        importedFrom: wikiArticles.importedFrom,
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

    return NextResponse.json({
      ...character,
      magicItems: magicItemsResult,
      wikiEntities: wikiEntitiesResult,
    });
  } catch (error) {
    console.error("Error fetching character with entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch character data" },
      { status: 500 },
    );
  }
}
