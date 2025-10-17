import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import {
  CreateCampaignSchema,
  validateRequestBody,
} from "@/lib/validation/schemas";

// GET /api/campaigns - Get all campaigns
export async function GET() {
  try {
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        status: campaigns.status,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));

    return NextResponse.json(allCampaigns);
  } catch (error) {
    logger.error("Failed to fetch campaigns", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}

// POST /api/campaigns - Create a new campaign
// DEPRECATED: Use Server Action createCampaign instead. This endpoint is kept for backward compatibility.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(CreateCampaignSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const validatedData = validation.data;

    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status,
        startDate: validatedData.startDate || null,
        endDate: validatedData.endDate || null,
        gameEditionId: validatedData.gameEditionId,
      })
      .returning();

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    logger.error("Failed to create campaign", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
