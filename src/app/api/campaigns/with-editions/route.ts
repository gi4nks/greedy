import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/actions/campaigns";

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Failed to fetch campaigns with editions:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}
