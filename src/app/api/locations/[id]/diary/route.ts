import { NextRequest, NextResponse } from "next/server";
import { createDiaryRouteHandlers } from "@/lib/api/diary";

const handlers = createDiaryRouteHandlers("location");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const locationId = Number(id);

    if (!Number.isFinite(locationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid location ID" },
        { status: 400 },
      );
    }

    try {
      const entries = await handlers.listEntries(locationId);
      return NextResponse.json({ success: true, data: entries });
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch diary entries" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Failed to parse diary route params:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const locationId = Number(id);

    if (!Number.isFinite(locationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid location ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = await handlers.createEntry(locationId, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating diary entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create diary entry" },
      { status: 500 },
    );
  }
}
