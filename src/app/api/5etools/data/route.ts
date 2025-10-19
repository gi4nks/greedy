import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");

    if (!source) {
      return NextResponse.json(
        { error: "Source parameter is required" },
        { status: 400 },
      );
    }

    // Try to read from local files first
    const localPath = path.join(process.cwd(), "public", "5etools", "data", source.replace(/^\//, ""));
    
    try {
      const localData = await fs.readFile(localPath, "utf-8");
      const data = JSON.parse(localData);
      
      // Add CORS headers
      return NextResponse.json(data, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, s-maxage=3600", // Cache for 1 hour
        },
      });
    } catch (localError) {
      // Local file not found, try remote
      console.log(`Local file not found for ${source}, trying remote: ${localError}`);
    }

    // Construct the full 5e.tools URL
    const url = `https://5e.tools/data${source}`;

    // Fetch data from 5e.tools
    const response = await fetch(url, {
      headers: {
        "User-Agent": "greedy-Bot/1.0",
        Accept: "application/json",
      },
      // Add a timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(
        `5e.tools API error: ${response.status} ${response.statusText} for URL: ${url}`,
      );
      return NextResponse.json(
        { error: `Failed to fetch from 5e.tools: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Add CORS headers to allow frontend access
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, s-maxage=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error proxying 5e.tools request:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "5e.tools request timed out" },
        { status: 408 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error while fetching 5e.tools data" },
      { status: 500 },
    );
  }
}
