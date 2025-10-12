import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quests, wikiArticleEntities, wikiArticles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/quests/[id] - Get quest with all assigned wiki entities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const questId = parseInt(resolvedParams.id);

    // Get quest basic info
    const [quest] = await db
      .select()
      .from(quests)
      .where(eq(quests.id, questId));

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Get assigned wiki entities
    const wikiEntitiesResult = await db
      .select({
        id: wikiArticles.id,
        title: wikiArticles.title,
        contentType: wikiArticles.contentType,
        wikiUrl: wikiArticles.wikiUrl,
        description: wikiArticles.rawContent, // Map rawContent to description for frontend compatibility
        parsedData: wikiArticles.parsedData,
        relationshipType: wikiArticleEntities.relationshipType,
        relationshipData: wikiArticleEntities.relationshipData,
      })
      .from(wikiArticleEntities)
      .innerJoin(wikiArticles, eq(wikiArticleEntities.wikiArticleId, wikiArticles.id))
      .where(sql`${wikiArticleEntities.entityType} = 'quest' AND ${wikiArticleEntities.entityId} = ${questId}`);

    return NextResponse.json({
      ...quest,
      wikiEntities: wikiEntitiesResult,
    });
  } catch (error) {
    console.error('Error fetching quest with wiki entities:', error);
    return NextResponse.json({ error: 'Failed to fetch quest data' }, { status: 500 });
  }
}