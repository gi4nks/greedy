import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adventures } from "@/lib/db/schema";
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

    const campaignAdventures = await db
      .select({
        id: adventures.id,
        title: adventures.title,
        description: adventures.description,
        startDate: adventures.startDate,
        endDate: adventures.endDate,
        status: adventures.status,
      })
      .from(adventures)
      .where(eq(adventures.campaignId, campaignId))
      .orderBy(adventures.title);

    return NextResponse.json(campaignAdventures);
  } catch (error) {
    console.error("Failed to fetch campaign adventures:", error);
    return NextResponse.json(
      { error: "Failed to fetch adventures" },
      { status: 500 },
    );
  }
}