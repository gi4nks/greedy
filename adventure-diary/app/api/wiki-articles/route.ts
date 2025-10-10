import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wikiArticles, wikiArticleEntities } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

// GET /api/wiki-articles - Get all wiki articles with their entity relationships
export async function GET() {
  try {
    const articles = await db
      .select({
        id: wikiArticles.id,
        title: wikiArticles.title,
        contentType: wikiArticles.contentType,
        wikiUrl: wikiArticles.wikiUrl,
        rawContent: wikiArticles.rawContent,
        parsedData: wikiArticles.parsedData,
        importedFrom: wikiArticles.importedFrom,
        createdAt: wikiArticles.createdAt,
        updatedAt: wikiArticles.updatedAt,
        entityRelationships: sql<string>`json_group_array(
          CASE WHEN ${wikiArticleEntities.id} IS NOT NULL THEN
            json_object(
              'id', ${wikiArticleEntities.id},
              'entityType', ${wikiArticleEntities.entityType},
              'entityId', ${wikiArticleEntities.entityId},
              'relationshipType', ${wikiArticleEntities.relationshipType},
              'relationshipData', ${wikiArticleEntities.relationshipData}
            )
          END
        )`.as('entityRelationships')
      })
      .from(wikiArticles)
      .leftJoin(wikiArticleEntities, eq(wikiArticles.id, wikiArticleEntities.wikiArticleId))
      .groupBy(wikiArticles.id)
      .orderBy(wikiArticles.title);

    // Parse entity relationships and filter out nulls
    const articlesWithRelationships = articles.map((article: {
      id: number;
      title: string;
      contentType: string;
      wikiUrl: string | null;
      rawContent: string | null;
      parsedData: unknown;
      importedFrom: string | null;
      createdAt: string | null;
      updatedAt: string | null;
      entityRelationships: string;
    }) => ({
      ...article,
      entityRelationships: article.entityRelationships
        ? JSON.parse(article.entityRelationships).filter((rel: unknown) => rel !== null)
        : []
    }));

    return NextResponse.json(articlesWithRelationships);
  } catch (error) {
    console.error('Error fetching wiki articles:', error);
    return NextResponse.json({ error: 'Failed to fetch wiki articles' }, { status: 500 });
  }
}

// POST /api/wiki-articles - Create a new wiki article or return existing one
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if article already exists by title and wikiUrl
    const existingArticle = await db
      .select()
      .from(wikiArticles)
      .where(
        and(
          eq(wikiArticles.title, body.title),
          eq(wikiArticles.wikiUrl, body.wikiUrl)
        )
      )
      .limit(1);

    if (existingArticle.length > 0) {
      // Return existing article
      return NextResponse.json(existingArticle[0]);
    }

    // Create new article
    const [newArticle] = await db.insert(wikiArticles).values({
      title: body.title,
      contentType: body.contentType,
      wikiUrl: body.wikiUrl,
      rawContent: body.rawContent,
      parsedData: body.parsedData,
      importedFrom: body.importedFrom || 'wiki',
    }).returning();

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki article:', error);
    return NextResponse.json({ error: 'Failed to create wiki article' }, { status: 500 });
  }
}