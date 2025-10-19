import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiArticles, wikiArticleEntities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

// DELETE /api/wiki-articles/[id] - Delete a wiki article and its relationships
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 },
      );
    }

    // First, delete all relationships for this article
    await db
      .delete(wikiArticleEntities)
      .where(eq(wikiArticleEntities.wikiArticleId, articleId));

    // Then delete the article itself
    const result = await db
      .delete(wikiArticles)
      .where(eq(wikiArticles.id, articleId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Wiki article not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wiki article deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting wiki article", error);
    return NextResponse.json(
      { error: "Failed to delete wiki article" },
      { status: 500 },
    );
  }
}