import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
        name: characters.name,
      })
      .from(characters)
      .where(eq(characters.campaignId, campaignId))
      .orderBy(characters.name);

    return NextResponse.json(campaignCharacters);
  } catch (error) {
    console.error("Failed to fetch assignable characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 },
    );
  }
}