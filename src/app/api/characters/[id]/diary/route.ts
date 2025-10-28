import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, characterDiaryEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DiaryEntrySchema, validateRequestBody } from "@/lib/validation/schemas";

// GET /api/characters/[id]/diary - Get all diary entries for a character
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);

    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid character ID" },
        { status: 400 },
      );
    }

    // Check if character exists
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId));

    if (!character) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 },
      );
    }

    // Get diary entries
    const diaryEntries = await db
      .select()
      .from(characterDiaryEntries)
      .where(eq(characterDiaryEntries.characterId, characterId))
      .orderBy(characterDiaryEntries.date);

    // Parse JSON fields
    const parsedEntries = diaryEntries.map(entry => ({
      ...entry,
      linkedEntities: entry.linkedEntities ? JSON.parse(entry.linkedEntities as string) : [],
    }));

    return NextResponse.json({ success: true, data: parsedEntries });
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch diary entries" },
      { status: 500 },
    );
  }
}

// POST /api/characters/[id]/diary - Create a new diary entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);

    if (isNaN(characterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid character ID" },
        { status: 400 },
      );
    }

    // Check if character exists
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId));

    if (!character) {
      return NextResponse.json(
        { success: false, error: "Character not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validation = validateRequestBody(DiaryEntrySchema, body);

    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const validatedData = validation.data;

    // Insert new diary entry
    const [newEntry] = await db
      .insert(characterDiaryEntries)
      .values({
        characterId,
        description: validatedData.description,
        date: validatedData.date,
        linkedEntities: validatedData.linkedEntities ? JSON.stringify(validatedData.linkedEntities) : null,
        isImportant: validatedData.isImportant,
      })
      .returning();

    // Parse JSON fields for response
    const parsedEntry = {
      ...newEntry,
      linkedEntities: newEntry.linkedEntities ? JSON.parse(newEntry.linkedEntities as string) : [],
    };

    return NextResponse.json({ success: true, data: parsedEntry }, { status: 201 });
  } catch (error) {
    console.error("Error creating diary entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create diary entry" },
      { status: 500 },
    );
  }
}