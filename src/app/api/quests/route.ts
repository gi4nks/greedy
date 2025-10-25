import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/quests?campaignId=X - Get all quests for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    const questsList = await db
      .select({
        id: quests.id,
        title: quests.title,
        description: quests.description,
        status: quests.status,
        priority: quests.priority,
        adventureId: quests.adventureId,
        assignedTo: quests.assignedTo,
        createdAt: quests.createdAt,
      })
      .from(quests)
      .innerJoin(adventures, eq(quests.adventureId, adventures.id))
      .where(eq(adventures.campaignId, parseInt(campaignId)))
      .orderBy(quests.createdAt);

    return NextResponse.json(questsList);
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json(
      { error: "Failed to fetch quests" },
      { status: 500 }
    );
  }
}
