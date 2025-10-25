import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters, characterDiaryEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/characters/[id]/diary/[entryId] - Update a diary entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);
    const entryId = parseInt(resolvedParams.entryId);

    if (isNaN(characterId) || isNaN(entryId)) {
      return NextResponse.json(
        { error: "Invalid character ID or entry ID" },
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
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Check if diary entry exists and belongs to the character
    const [existingEntry] = await db
      .select()
      .from(characterDiaryEntries)
      .where(
        and(
          eq(characterDiaryEntries.id, entryId),
          eq(characterDiaryEntries.characterId, characterId),
        ),
      );

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Diary entry not found" },
        { status: 404 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { description, date, linkedEntities, isImportant } = body;

    // Validate required fields
    if (!description || !date) {
      return NextResponse.json(
        { error: "Description and date are required" },
        { status: 400 },
      );
    }

    // Update the diary entry
    const [updatedEntry] = await db
      .update(characterDiaryEntries)
      .set({
        description,
        date,
        linkedEntities: linkedEntities ? JSON.stringify(linkedEntities) : null,
        isImportant: isImportant || false,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(characterDiaryEntries.id, entryId),
          eq(characterDiaryEntries.characterId, characterId),
        ),
      )
      .returning();

    // Parse JSON fields for response
    const parsedEntry = {
      ...updatedEntry,
      linkedEntities: updatedEntry.linkedEntities ? JSON.parse(updatedEntry.linkedEntities as string) : [],
    };

    return NextResponse.json(parsedEntry);
  } catch (error) {
    console.error("Error updating diary entry:", error);
    return NextResponse.json(
      { error: "Failed to update diary entry" },
      { status: 500 },
    );
  }
}

// DELETE /api/characters/[id]/diary/[entryId] - Delete a diary entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);
    const entryId = parseInt(resolvedParams.entryId);

    if (isNaN(characterId) || isNaN(entryId)) {
      return NextResponse.json(
        { error: "Invalid character ID or entry ID" },
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
        { error: "Character not found" },
        { status: 404 },
      );
    }

    // Check if diary entry exists and belongs to the character
    const [existingEntry] = await db
      .select()
      .from(characterDiaryEntries)
      .where(
        and(
          eq(characterDiaryEntries.id, entryId),
          eq(characterDiaryEntries.characterId, characterId),
        ),
      );

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Diary entry not found" },
        { status: 404 },
      );
    }

    // Delete the diary entry
    await db
      .delete(characterDiaryEntries)
      .where(
        and(
          eq(characterDiaryEntries.id, entryId),
          eq(characterDiaryEntries.characterId, characterId),
        ),
      );

    return NextResponse.json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    return NextResponse.json(
      { error: "Failed to delete diary entry" },
      { status: 500 },
    );
  }
}