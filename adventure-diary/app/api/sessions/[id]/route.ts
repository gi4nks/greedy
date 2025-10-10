import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, wikiArticleEntities, wikiArticles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/sessions/[id] - Get session with all assigned wiki entities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.id);

    // Get session basic info
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
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
      .where(sql`${wikiArticleEntities.entityType} = 'session' AND ${wikiArticleEntities.entityId} = ${sessionId}`);

    return NextResponse.json({
      ...session,
      wikiEntities: wikiEntitiesResult,
    });
  } catch (error) {
    console.error('Error fetching session with wiki entities:', error);
    return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 });
  }
}