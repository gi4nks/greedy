import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/locations?campaignId=X - Get all locations for a campaign
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

    const locationsList = await db
      .select({
        id: locations.id,
        name: locations.name,
        description: locations.description,
        campaignId: locations.campaignId,
        createdAt: locations.createdAt,
      })
      .from(locations)
      .where(eq(locations.campaignId, parseInt(campaignId)))
      .orderBy(locations.name);

    return NextResponse.json(locationsList);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const campaignId = formData.get("campaignId");
    const name = formData.get("name");
    const tags = formData.get("tags") || "[]";
    const images = formData.get("images") || "[]";

    if (!campaignId || !name) {
      return NextResponse.json(
        { error: "campaignId and name are required" },
        { status: 400 }
      );
    }

    const [newLocation] = await db
      .insert(locations)
      .values({
        campaignId: Number(campaignId),
        name: name.toString(),
        tags: tags.toString(),
        images: images.toString(),
      })
      .returning();

    return NextResponse.json({ success: true, location: newLocation });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}