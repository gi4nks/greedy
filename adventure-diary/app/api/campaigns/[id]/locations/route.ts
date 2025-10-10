import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { locations, adventures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    const campaignLocations = await db
      .select({
        id: locations.id,
        name: locations.name,
      })
      .from(locations)
      .innerJoin(adventures, eq(locations.adventureId, adventures.id))
      .where(eq(adventures.campaignId, campaignId))
      .orderBy(locations.name);

    return NextResponse.json(campaignLocations);
  } catch (error) {
    console.error('Failed to fetch campaign locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}