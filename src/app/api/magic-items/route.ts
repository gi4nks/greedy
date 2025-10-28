import { NextRequest, NextResponse } from "next/server";
import {
  getMagicItemsWithAssignments,
  type MagicItemFilters,
} from "@/lib/actions/magicItems";
import { logger } from "@/lib/utils/logger";

// GET /api/magic-items - Get all magic items with their assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: MagicItemFilters = {
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      rarity: searchParams.get("rarity") ?? undefined,
      entityType: (searchParams.get("entityType") ??
        undefined) as MagicItemFilters["entityType"],
      campaignId: searchParams.get("campaignId")
        ? Number(searchParams.get("campaignId"))
        : undefined,
    };

    const items = await getMagicItemsWithAssignments(filters);
    return NextResponse.json(items);
  } catch (error) {
    logger.error("Error fetching magic items", error);
    return NextResponse.json(
      { error: "Failed to fetch magic items" },
      { status: 500 },
    );
  }
}
