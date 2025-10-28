import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, magicItems, magicItemAssignments } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

type MagicItemSummary = {
  id: number;
  assignmentId: number;
  name: string;
  rarity: string | null;
  type: string | null;
  description: string | null;
  source: string | null;
  notes: string | null;
  metadata: unknown;
  assignedAt: string | null;
  campaignId: number | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 },
      );
    }

    const campaignCharacters = await db
      .select({
        id: characters.id,
        characterType: characters.characterType,
        name: characters.name,
        race: characters.race,
      })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .orderBy(characters.name);

    const characterIds = campaignCharacters.map((character) => character.id);

    const assignments = characterIds.length
      ? await db
          .select({
            entityId: magicItemAssignments.entityId,
            assignmentId: magicItemAssignments.id,
            magicItemId: magicItems.id,
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
              inArray(magicItemAssignments.entityId, characterIds),
            ),
          )
      : [];

    const assignmentsByCharacter = new Map<number, MagicItemSummary[]>();
    assignments.forEach((assignment) => {
      if (!assignmentsByCharacter.has(assignment.entityId)) {
        assignmentsByCharacter.set(assignment.entityId, []);
      }
      assignmentsByCharacter.get(assignment.entityId)!.push({
        id: assignment.magicItemId,
        assignmentId: assignment.assignmentId,
        name: assignment.name,
        rarity: assignment.rarity,
        type: assignment.type,
        description: assignment.description,
        source: assignment.source,
        notes: assignment.notes,
        metadata: assignment.metadata,
        assignedAt: assignment.assignedAt,
        campaignId: assignment.campaignId,
      });
    });

    const charactersWithMagicItems = campaignCharacters.map(
      (character) => ({
        ...character,
        magicItems: assignmentsByCharacter.get(character.id) ?? [],
      }),
    );

    return NextResponse.json(charactersWithMagicItems);
  } catch (error) {
    console.error("Failed to fetch campaign characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 },
    );
  }
}
