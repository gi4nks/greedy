import { NextRequest, NextResponse } from "next/server";

const WIKI_BASE_URL = "https://adnd2e.fandom.com/api.php";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const limit = searchParams.get("limit") || "10";

    if (!query && !category) {
      return NextResponse.json(
        { error: "Query or category parameter is required" },
        { status: 400 },
      );
    }

    let apiUrl = "";

    if (category) {
      // For category searches, we'll use the opensearch but note this is limited
      apiUrl = `${WIKI_BASE_URL}?action=opensearch&search=${encodeURIComponent(category)}&limit=${limit}&namespace=0&format=json`;
    } else if (query) {
      // Use MediaWiki opensearch API
      apiUrl = `${WIKI_BASE_URL}?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "greedy/1.0 (https://github.com/gi4nks/greedy)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Wiki API returned ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Transform MediaWiki opensearch response to match our interface
    // OpenSearch returns: [query, [titles], [descriptions], [urls]]
    if (Array.isArray(data) && data.length >= 4) {
      const [, titles, descriptions, urls] = data;
      const items = titles.map((title: string, index: number) => ({
        id: index + 1,
        title: title,
        url: urls[index] || "",
        abstract: descriptions[index] || "",
        type: "article",
      }));

      const result = {
        items,
        basepath: "https://adnd2e.fandom.com",
        offset: 0,
      };

      return NextResponse.json(result);
    } else {
      // Fallback for unexpected response format
      return NextResponse.json({
        items: [],
        basepath: "https://adnd2e.fandom.com",
        offset: 0,
      });
    }
  } catch (error) {
    console.error("Wiki search error:", error);
    return NextResponse.json(
      { error: "Failed to search wiki" },
      { status: 500 },
    );
  }
}
