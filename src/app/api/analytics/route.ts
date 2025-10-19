import { NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics";

export async function GET() {
  try {
    const analytics = await AnalyticsService.getGlobalAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
