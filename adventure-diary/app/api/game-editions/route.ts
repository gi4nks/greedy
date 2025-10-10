import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/game-editions - Get all active game editions
export async function GET() {
  try {
    const editions = await db
      .select({
        id: gameEditions.id,
        code: gameEditions.code,
        name: gameEditions.name,
        version: gameEditions.version,
        publisher: gameEditions.publisher,
      })
      .from(gameEditions)
      .where(eq(gameEditions.isActive, true))
      .orderBy(gameEditions.name);

    return NextResponse.json(editions);
  } catch (error) {
    console.error('Failed to fetch game editions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game editions' },
      { status: 500 }
    );
  }
}