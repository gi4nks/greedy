import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characterDiaryEntries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for creating/updating a diary entry
const diaryEntrySchema = z.object({
  characterId: z.number(),
  description: z.string().min(1),
  date: z.string(),
  linkedEntities: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
    })
  ).optional().default([]),
  isImportant: z.boolean().optional().default(false),
});

// GET /api/characters/[id]/diary - Get all diary entries for a character
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);

    const entries = await db
      .select()
      .from(characterDiaryEntries)
      .where(eq(characterDiaryEntries.characterId, characterId))
      .orderBy(desc(characterDiaryEntries.date));

    // Parse linkedEntities JSON
    const parsedEntries = entries.map(entry => ({
      ...entry,
      linkedEntities: entry.linkedEntities 
        ? JSON.parse(entry.linkedEntities as string)
        : [],
      isImportant: Boolean(entry.isImportant),
    }));

    return NextResponse.json(parsedEntries);
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch diary entries" },
      { status: 500 }
    );
  }
}

// POST /api/characters/[id]/diary - Create a new diary entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const characterId = parseInt(resolvedParams.id);
    const body = await request.json();
    
    const validatedData = diaryEntrySchema.parse({
      ...body,
      characterId,
    });

    const [newEntry] = await db
      .insert(characterDiaryEntries)
      .values({
        characterId: validatedData.characterId,
        description: validatedData.description,
        date: validatedData.date,
        linkedEntities: validatedData.linkedEntities,
        isImportant: validatedData.isImportant,
      })
      .returning();

    return NextResponse.json(
      {
        ...newEntry,
        linkedEntities: newEntry.linkedEntities 
          ? JSON.parse(newEntry.linkedEntities as string)
          : [],
        isImportant: Boolean(newEntry.isImportant),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating diary entry:", error);
    return NextResponse.json(
      { error: "Failed to create diary entry" },
      { status: 500 }
    );
  }
}
