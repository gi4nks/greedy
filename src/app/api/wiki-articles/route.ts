import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiArticles, wikiArticleEntities } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { CreateWikiArticleSchema, validateRequestBody } from "@/lib/validation/schemas";

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
        )`.as("entityRelationships"),
      })
      .from(wikiArticles)
      .leftJoin(
        wikiArticleEntities,
        eq(wikiArticles.id, wikiArticleEntities.wikiArticleId),
      )
      .groupBy(wikiArticles.id)
      .orderBy(wikiArticles.title);

    // Parse entity relationships and filter out nulls
    const articlesWithRelationships = articles.map(
      (article: {
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
          ? JSON.parse(article.entityRelationships).filter(
              (rel: unknown) => rel !== null,
            )
          : [],
      }),
    );

    return NextResponse.json(articlesWithRelationships);
  } catch (error) {
    logger.error("Error fetching wiki articles", error);
    return NextResponse.json(
      { error: "Failed to fetch wiki articles" },
      { status: 500 },
    );
  }
}

// POST /api/wiki-articles - Create a new wiki article or return existing one
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.info("Wiki article POST request body:", body);
    
    const validation = validateRequestBody(CreateWikiArticleSchema, body);

    if (!validation.success) {
      logger.error("Wiki article validation failed", validation.data);
      return NextResponse.json(validation, { status: 400 });
    }

    const validatedData = validation.data;

    // Check if article already exists by title and wikiUrl (if provided)
    const whereConditions = [eq(wikiArticles.title, validatedData.title)];
    if (validatedData.wikiUrl && validatedData.wikiUrl.length > 0) {
      whereConditions.push(eq(wikiArticles.wikiUrl, validatedData.wikiUrl));
    }

    const existingArticle = await db
      .select()
      .from(wikiArticles)
      .where(and(...whereConditions))
      .limit(1);

    if (existingArticle.length > 0) {
      // Return existing article
      return NextResponse.json({ success: true, data: existingArticle[0] });
    }

    // Create new article
    const [newArticle] = await db
      .insert(wikiArticles)
      .values({
        title: validatedData.title,
        contentType: validatedData.contentType,
        wikiUrl: validatedData.wikiUrl && validatedData.wikiUrl.length > 0 ? validatedData.wikiUrl : null,
        rawContent: validatedData.rawContent || null,
        parsedData: validatedData.parsedData || null,
        importedFrom: validatedData.importedFrom,
      })
      .returning();

    return NextResponse.json({ success: true, data: newArticle }, { status: 201 });
  } catch (error) {
    logger.error("Error creating wiki article", error);
    return NextResponse.json(
      { success: false, error: "Failed to create wiki article" },
      { status: 500 },
    );
  }
}
