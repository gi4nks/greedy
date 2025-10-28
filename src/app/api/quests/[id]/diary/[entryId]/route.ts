import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questDiaryEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/quests/[id]/diary/[entryId] - Update a diary entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const resolvedParams = await params;
    const questId = parseInt(resolvedParams.id);
    const entryId = parseInt(resolvedParams.entryId);

    if (isNaN(questId) || isNaN(entryId)) {
      return NextResponse.json(
        { error: "Invalid quest ID or entry ID" },
        { status: 400 },
      );
    }

    // Check if diary entry exists and belongs to the quest
    const [existingEntry] = await db
      .select()
      .from(questDiaryEntries)
      .where(
        and(
          eq(questDiaryEntries.id, entryId),
          eq(questDiaryEntries.questId, questId),
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

    if (!description || !date) {
      return NextResponse.json(
        { error: "Description and date are required" },
        { status: 400 },
      );
    }

    // Update diary entry
    const [updatedEntry] = await db
      .update(questDiaryEntries)
      .set({
        description,
        date,
        linkedEntities: linkedEntities ? JSON.stringify(linkedEntities) : null,
        isImportant: isImportant || false,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(questDiaryEntries.id, entryId),
        eq(questDiaryEntries.questId, questId)
      ))
      .returning();

    // Parse JSON fields for response
    const parsedEntry = {
      ...updatedEntry,
      linkedEntities: updatedEntry.linkedEntities ? JSON.parse(updatedEntry.linkedEntities as string) : [],
    };

    return NextResponse.json(parsedEntry);
  } catch (error) {
    console.error("Error updating quest diary entry:", error);
    return NextResponse.json(
      { error: "Failed to update diary entry" },
      { status: 500 },
    );
  }
}

// DELETE /api/quests/[id]/diary/[entryId] - Delete a diary entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const resolvedParams = await params;
    const questId = parseInt(resolvedParams.id);
    const entryId = parseInt(resolvedParams.entryId);

    if (isNaN(questId) || isNaN(entryId)) {
      return NextResponse.json(
        { error: "Invalid quest ID or entry ID" },
        { status: 400 },
      );
    }

    // Check if diary entry exists and belongs to the quest
    const [existingEntry] = await db
      .select()
      .from(questDiaryEntries)
      .where(
        and(
          eq(questDiaryEntries.id, entryId),
          eq(questDiaryEntries.questId, questId),
        ),
      );

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Diary entry not found" },
        { status: 404 },
      );
    }

    // Delete diary entry
    await db
      .delete(questDiaryEntries)
      .where(and(
        eq(questDiaryEntries.id, entryId),
        eq(questDiaryEntries.questId, questId)
      ));

    return NextResponse.json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting quest diary entry:", error);
    return NextResponse.json(
      { error: "Failed to delete diary entry" },
      { status: 500 },
    );
  }
}