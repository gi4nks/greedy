import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quests, adventures } from '@/lib/db/schema';
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

    const campaignQuests = await db
      .select({
        id: quests.id,
        title: quests.title,
      })
      .from(quests)
      .innerJoin(adventures, eq(quests.adventureId, adventures.id))
      .where(eq(adventures.campaignId, campaignId))
      .orderBy(quests.title);

    return NextResponse.json(campaignQuests);
  } catch (error) {
    console.error('Failed to fetch campaign quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}