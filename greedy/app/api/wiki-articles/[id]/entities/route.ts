import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wikiArticleEntities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/wiki-articles/[id]/entities - Create relationship between wiki article and entity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);
    const { entityType, entityId, relationshipType, relationshipData } = await request.json();

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    // Check if relationship already exists
    const existingRelationship = await db
      .select()
      .from(wikiArticleEntities)
      .where(
        and(
          eq(wikiArticleEntities.wikiArticleId, articleId),
          eq(wikiArticleEntities.entityType, entityType),
          eq(wikiArticleEntities.entityId, entityId)
        )
      )
      .limit(1);

    if (existingRelationship.length > 0) {
      // Return existing relationship
      return NextResponse.json(existingRelationship[0]);
    }

    const [newRelationship] = await db.insert(wikiArticleEntities).values({
      wikiArticleId: articleId,
      entityType,
      entityId,
      relationshipType: relationshipType || 'referenced',
      relationshipData: relationshipData || {},
    }).returning();

    return NextResponse.json(newRelationship, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki article relationship:', error);
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 });
  }
}

// DELETE /api/wiki-articles/[id]/entities - Remove relationship between wiki article and entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);
    const body = await request.json();
    const { entityType, entityId } = body;

    console.log('DELETE wiki article relationship:', { articleId, entityType, entityId });

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    // Delete the relationship from the database
    const result = await db
      .delete(wikiArticleEntities)
      .where(
        and(
          eq(wikiArticleEntities.wikiArticleId, articleId),
          eq(wikiArticleEntities.entityType, entityType),
          eq(wikiArticleEntities.entityId, entityId)
        )
      )
      .returning();

    if (result.length === 0) {
      // Relationship didn't exist, treat as success (idempotent operation)
      console.log('Relationship not found, treating as success');
      return NextResponse.json({ success: true, message: 'Relationship deleted successfully' });
    }

    console.log('Relationship deleted successfully');
    return NextResponse.json({ success: true, message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting wiki article relationship:', error);
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 });
  }
}

// GET /api/wiki-articles/[id]/entities - Get all entities related to a wiki article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id);

    const relationships = await db
      .select()
      .from(wikiArticleEntities)
      .where(eq(wikiArticleEntities.wikiArticleId, articleId));

    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error fetching wiki article relationships:', error);
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 });
  }
}