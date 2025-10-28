import { NextRequest, NextResponse } from "next/server";
import {
  getMagicItemById,
} from "@/lib/actions/magicItems";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    const item = await getMagicItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: "Magic item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching magic item:", error);
    return NextResponse.json(
      { error: "Failed to fetch magic item" },
      { status: 500 },
    );
  }
}
