import { NextRequest, NextResponse } from "next/server";
import { SearchService, SearchFilters } from "@/lib/services/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    // Build filters from search parameters
    const filters: SearchFilters = {
      entityTypes: searchParams.get("entityTypes")?.split(",") || undefined,
      dateRange: {
        start: searchParams.get("start") || undefined,
        end: searchParams.get("end") || undefined,
      },
      tags: searchParams.get("tags")?.split(",") || undefined,
      sortBy:
        (searchParams.get("sort") as SearchFilters["sortBy"]) || "relevance",
    };

    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;

    const results = await SearchService.search(query, filters, limit);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
