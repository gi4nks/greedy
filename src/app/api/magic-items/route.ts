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

// POST /api/magic-items - Create a new magic item
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name");
    const type = formData.get("type") || "";
    const rarity = formData.get("rarity") || "";
    const description = formData.get("description") || "";
    const properties = formData.get("properties") || "";
    const tags = formData.get("tags") || "";
    const images = formData.get("images") || "";
    const attunementRequired = formData.get("attunementRequired") === "true";

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const { createMagicItem } = await import("@/lib/actions/magicItems");

    // Parse properties and tags
    let parsedProperties: Record<string, unknown> | null = null;
    if (properties) {
      try {
        parsedProperties = JSON.parse(properties.toString());
      } catch (error) {
        console.warn("Failed to parse properties", error);
      }
    }

    let parsedTags: string[] | null = null;
    if (tags) {
      try {
        const parsedTagData = JSON.parse(tags.toString());
        if (Array.isArray(parsedTagData) && parsedTagData.every(item => typeof item === 'string')) {
          parsedTags = parsedTagData;
        }
      } catch (error) {
        console.warn("Failed to parse tags", error);
      }
    }

    let parsedImages: unknown = null;
    if (images) {
      try {
        parsedImages = JSON.parse(images.toString());
      } catch (error) {
        console.warn("Failed to parse images", error);
      }
    }

    const created = await createMagicItem({
      name: name.toString(),
      type: type.toString() || null,
      rarity: rarity.toString() || null,
      description: description.toString() || null,
      properties: parsedProperties,
      tags: parsedTags,
      attunementRequired,
      images: parsedImages,
    });

    return NextResponse.json({ success: true, magicItem: created });
  } catch (error) {
    logger.error("Error creating magic item", error);
    return NextResponse.json(
      { error: "Failed to create magic item" },
      { status: 500 }
    );
  }
}
