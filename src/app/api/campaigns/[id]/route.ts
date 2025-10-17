import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
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

    const campaign = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        status: campaigns.status,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        tags: campaigns.tags,
        gameEditionId: campaigns.gameEditionId,
        gameEditionName: gameEditions.name,
        gameEditionVersion: gameEditions.version,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campaign.length === 0) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(campaign[0]);
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 },
    );
  }
}
