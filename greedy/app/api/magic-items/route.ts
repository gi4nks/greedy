import { NextRequest, NextResponse } from "next/server";
import {
  getMagicItemsWithAssignments,
  createMagicItem,
  type MagicItemFilters,
  type UpsertMagicItemInput,
} from "@/lib/actions/magicItems";
import { logger } from "@/lib/utils/logger";
import {
  CreateMagicItemSchema,
  validateRequestBody,
} from "@/lib/validation/schemas";

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

// POST /api/magic-items - Create a new magic item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(CreateMagicItemSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const validatedData = validation.data;
    const newItem = await createMagicItem(validatedData);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    logger.error("Error creating magic item", error);
    return NextResponse.json(
      { error: "Failed to create magic item" },
      { status: 500 },
    );
  }
}
