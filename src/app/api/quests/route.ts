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

// POST /api/quests - Create a new quest
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const campaignId = formData.get("campaignId");
    const title = formData.get("title");
    const description = formData.get("description");
    const status = formData.get("status") || "active";
    const priority = formData.get("priority") || "medium";
    const type = formData.get("type") || "main";
    const tags = formData.get("tags") || "[]";
    const images = formData.get("images") || "[]";

    if (!campaignId || !title) {
      return NextResponse.json(
        { error: "campaignId and title are required" },
        { status: 400 }
      );
    }

    // For now, we'll need to get an adventure ID. Let's find the first adventure in the campaign
    const [adventure] = await db
      .select({ id: adventures.id })
      .from(adventures)
      .where(eq(adventures.campaignId, Number(campaignId)))
      .limit(1);

    if (!adventure) {
      return NextResponse.json(
        { error: "No adventure found in campaign" },
        { status: 400 }
      );
    }

    const [newQuest] = await db
      .insert(quests)
      .values({
        adventureId: adventure.id,
        title: title.toString(),
        description: description?.toString() || null,
        status: status.toString(),
        priority: priority.toString(),
        type: type.toString(),
        tags: tags.toString(),
        images: images.toString(),
      })
      .returning();

    return NextResponse.json({ success: true, quest: newQuest });
  } catch (error) {
    console.error("Error creating quest:", error);
    return NextResponse.json(
      { error: "Failed to create quest" },
      { status: 500 }
    );
  }
}
