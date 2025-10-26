import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { npcs, adventures } from "@/lib/db/schema";
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

    const campaignNpcs = await db
      .select({
        id: npcs.id,
        name: npcs.name,
      })
      .from(npcs)
      .innerJoin(adventures, eq(npcs.adventureId, adventures.id))
      .where(eq(adventures.campaignId, campaignId))
      .orderBy(npcs.name);

    return NextResponse.json(campaignNpcs);
  } catch (error) {
    console.error("Failed to fetch assignable NPCs:", error);
    return NextResponse.json(
      { error: "Failed to fetch NPCs" },
      { status: 500 },
    );
  }
}