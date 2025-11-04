import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, magicItems, magicItemAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

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

export async function GET() {
  try {
    const allCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        race: characters.race,
        campaignId: characters.campaignId,
        adventureId: characters.adventureId,
        characterType: characters.characterType,
      })
      .from(characters)
      .orderBy(characters.name);

    const characterAssignments = await db
      .select({
        entityId: magicItemAssignments.entityId,
        entityType: magicItemAssignments.entityType,
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
      .where(eq(magicItemAssignments.entityType, "character"));

    const assignmentsByCharacter = new Map<number, MagicItemSummary[]>();
    characterAssignments.forEach((assignment) => {
      const characterId = assignment.entityId;
      if (!assignmentsByCharacter.has(characterId)) {
        assignmentsByCharacter.set(characterId, []);
      }
      assignmentsByCharacter.get(characterId)!.push({
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

    const charactersWithMagicItems = allCharacters.map(
      (character) => ({
        ...character,
        magicItems: assignmentsByCharacter.get(character.id) ?? [],
      }),
    );

    return NextResponse.json(charactersWithMagicItems);
  } catch (error) {
    logger.error("Error fetching characters", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const campaignId = formData.get("campaignId");
    const name = formData.get("name");
    const characterType = formData.get("characterType") || "npc";
    const strength = formData.get("strength") || "10";
    const dexterity = formData.get("dexterity") || "10";
    const constitution = formData.get("constitution") || "10";
    const intelligence = formData.get("intelligence") || "10";
    const wisdom = formData.get("wisdom") || "10";
    const charisma = formData.get("charisma") || "10";
    const hitPoints = formData.get("hitPoints") || "0";
    const maxHitPoints = formData.get("maxHitPoints") || "0";
    const armorClass = formData.get("armorClass") || "10";
    const classes = formData.get("classes") || "[]";
    const images = formData.get("images") || "[]";
    const tags = formData.get("tags") || "[]";

    if (!campaignId || !name) {
      return NextResponse.json(
        { error: "campaignId and name are required" },
        { status: 400 }
      );
    }

    const [newCharacter] = await db
      .insert(characters)
      .values({
        campaignId: Number(campaignId),
        name: name.toString(),
        characterType: characterType.toString(),
        strength: Number(strength),
        dexterity: Number(dexterity),
        constitution: Number(constitution),
        intelligence: Number(intelligence),
        wisdom: Number(wisdom),
        charisma: Number(charisma),
        hitPoints: Number(hitPoints),
        maxHitPoints: Number(maxHitPoints),
        armorClass: Number(armorClass),
        classes: classes.toString(),
        images: images.toString(),
        tags: tags.toString(),
      })
      .returning();

    return NextResponse.json({ success: true, character: newCharacter });
  } catch (error) {
    logger.error("Error creating character", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
}
