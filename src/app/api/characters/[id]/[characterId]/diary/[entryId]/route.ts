import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characterDiaryEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a diary entry
const updateDiaryEntrySchema = z.object({
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  linkedEntities: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
    })
  ).optional(),
  isImportant: z.boolean().optional(),
});

// PUT /api/characters/[id]/diary/[entryId] - Update a diary entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const entryId = parseInt(resolvedParams.entryId);
    const body = await request.json();
    
    const validatedData = updateDiaryEntrySchema.parse(body);

    const updateData: any = {};
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.date !== undefined) updateData.date = validatedData.date;
    if (validatedData.linkedEntities !== undefined) updateData.linkedEntities = validatedData.linkedEntities;
    if (validatedData.isImportant !== undefined) updateData.isImportant = validatedData.isImportant;
    
    updateData.updatedAt = new Date().toISOString();

    const [updatedEntry] = await db
      .update(characterDiaryEntries)
      .set(updateData)
      .where(eq(characterDiaryEntries.id, entryId))
      .returning();

    if (!updatedEntry) {
      return NextResponse.json(
        { error: "Diary entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updatedEntry,
      linkedEntities: updatedEntry.linkedEntities || [],
      isImportant: Boolean(updatedEntry.isImportant),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating diary entry:", error);
    return NextResponse.json(
      { error: "Failed to update diary entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/characters/[id]/diary/[entryId] - Delete a diary entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const entryId = parseInt(resolvedParams.entryId);

    await db
      .delete(characterDiaryEntries)
      .where(eq(characterDiaryEntries.id, entryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    return NextResponse.json(
      { error: "Failed to delete diary entry" },
      { status: 500 }
    );
  }
}
