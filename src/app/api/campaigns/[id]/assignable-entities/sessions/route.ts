import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, adventures } from "@/lib/db/schema";
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

    const campaignSessions = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionNumber: sessions.id, // Using id as session number for now
      })
      .from(sessions)
      .innerJoin(adventures, eq(sessions.adventureId, adventures.id))
      .where(eq(adventures.campaignId, campaignId))
      .orderBy(sessions.id);

    return NextResponse.json(campaignSessions);
  } catch (error) {
    console.error("Failed to fetch assignable sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}