import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, adventures } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/campaigns - Get all campaigns
export async function GET() {
  try {
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        status: campaigns.status,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));

    return NextResponse.json(allCampaigns);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, startDate, endDate, gameEditionId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        title,
        description: description || null,
        status: status || 'active',
        startDate: startDate || null,
        endDate: endDate || null,
        gameEditionId: gameEditionId || 1, // Default to D&D 5e
      })
      .returning();

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}