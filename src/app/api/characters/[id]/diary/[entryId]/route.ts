import { NextRequest, NextResponse } from "next/server";
import { createDiaryRouteHandlers } from "@/lib/api/diary";

const handlers = createDiaryRouteHandlers("character");

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const { id, entryId } = await params;
    const characterIdNum = Number(id);
    const entryIdNum = Number(entryId);

    if (!Number.isFinite(characterIdNum) || !Number.isFinite(entryIdNum)) {
      return NextResponse.json(
        { error: "Invalid character ID or entry ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = await handlers.updateEntry(characterIdNum, entryIdNum, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error updating diary entry:", error);
    return NextResponse.json(
      { error: "Failed to update diary entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  try {
    const { id, entryId } = await params;
    const characterIdNum = Number(id);
    const entryIdNum = Number(entryId);

    if (!Number.isFinite(characterIdNum) || !Number.isFinite(entryIdNum)) {
      return NextResponse.json(
        { error: "Invalid character ID or entry ID" },
        { status: 400 },
      );
    }

    try {
      await handlers.deleteEntry(characterIdNum, entryIdNum);
      return NextResponse.json({ message: "Diary entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting diary entry:", error);
      return NextResponse.json(
        { error: "Diary entry not found" },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    return NextResponse.json(
      { error: "Failed to delete diary entry" },
      { status: 500 },
    );
  }
}
