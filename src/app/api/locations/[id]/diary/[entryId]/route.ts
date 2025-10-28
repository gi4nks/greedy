import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { locationDiaryEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/locations/[id]/diary/[entryId] - Update a diary entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const resolvedParams = await params;
    const locationId = parseInt(resolvedParams.id);
    const entryId = parseInt(resolvedParams.entryId);

    if (isNaN(locationId) || isNaN(entryId)) {
      return NextResponse.json(
        { error: "Invalid location ID or entry ID" },
        { status: 400 },
      );
    }

    // Check if diary entry exists and belongs to the location
    const [existingEntry] = await db
      .select()
      .from(locationDiaryEntries)
      .where(
        and(
          eq(locationDiaryEntries.id, entryId),
          eq(locationDiaryEntries.locationId, locationId),
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
      .update(locationDiaryEntries)
      .set({
        description,
        date,
        linkedEntities: linkedEntities ? JSON.stringify(linkedEntities) : null,
        isImportant: isImportant || false,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(locationDiaryEntries.id, entryId),
        eq(locationDiaryEntries.locationId, locationId)
      ))
      .returning();

    // Parse JSON fields for response
    const parsedEntry = {
      ...updatedEntry,
      linkedEntities: updatedEntry.linkedEntities ? JSON.parse(updatedEntry.linkedEntities as string) : [],
    };

    return NextResponse.json(parsedEntry);
  } catch (error) {
    console.error("Error updating location diary entry:", error);
    return NextResponse.json(
      { error: "Failed to update diary entry" },
      { status: 500 },
    );
  }
}

// DELETE /api/locations/[id]/diary/[entryId] - Delete a diary entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const resolvedParams = await params;
    const locationId = parseInt(resolvedParams.id);
    const entryId = parseInt(resolvedParams.entryId);

    if (isNaN(locationId) || isNaN(entryId)) {
      return NextResponse.json(
        { error: "Invalid location ID or entry ID" },
        { status: 400 },
      );
    }

    // Check if diary entry exists and belongs to the location
    const [existingEntry] = await db
      .select()
      .from(locationDiaryEntries)
      .where(
        and(
          eq(locationDiaryEntries.id, entryId),
          eq(locationDiaryEntries.locationId, locationId),
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
      .delete(locationDiaryEntries)
      .where(and(
        eq(locationDiaryEntries.id, entryId),
        eq(locationDiaryEntries.locationId, locationId)
      ));

    return NextResponse.json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting location diary entry:", error);
    return NextResponse.json(
      { error: "Failed to delete diary entry" },
      { status: 500 },
    );
  }
}