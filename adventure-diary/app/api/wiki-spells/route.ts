import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wikiArticles, wikiArticleEntities, characters } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/wiki-spells - Get all wiki spells with their assigned characters
export async function GET() {
  try {
    const spells = await db
      .select({
        id: wikiArticles.id,
        name: wikiArticles.title,
        level: wikiArticles.parsedData,
        school: wikiArticles.parsedData,
        range: wikiArticles.parsedData,
        duration: wikiArticles.parsedData,
        castingTime: wikiArticles.parsedData,
        components: wikiArticles.parsedData,
        description: wikiArticles.parsedData,
        wikiUrl: wikiArticles.wikiUrl,
        importedFrom: wikiArticles.importedFrom,
        createdAt: wikiArticles.createdAt,
        assignedCharacters: sql<string>`json_group_array(
          CASE WHEN ${characters.id} IS NOT NULL THEN
            json_object(
              'id', ${characters.id},
              'name', ${characters.name},
              'isPrepared', json_extract(${wikiArticleEntities.relationshipData}, '$.isPrepared'),
              'isKnown', json_extract(${wikiArticleEntities.relationshipData}, '$.isKnown')
            )
          END
        )`.as('assignedCharacters')
      })
      .from(wikiArticles)
      .leftJoin(wikiArticleEntities, eq(wikiArticles.id, wikiArticleEntities.wikiArticleId))
      .leftJoin(characters, sql`${wikiArticleEntities.entityType} = 'character' AND ${wikiArticleEntities.entityId} = ${characters.id}`)
      .where(eq(wikiArticles.contentType, 'spell'))
      .groupBy(wikiArticles.id)
      .orderBy(wikiArticles.title);

    // Parse assigned characters and filter out nulls
    const spellsWithCharacters = spells.map((spell: any) => ({
      ...spell,
      assignedCharacters: spell.assignedCharacters
        ? JSON.parse(spell.assignedCharacters).filter((char: any) => char !== null)
        : []
    }));

    return NextResponse.json(spellsWithCharacters);
  } catch (error) {
    console.error('Error fetching wiki spells:', error);
    return NextResponse.json({ error: 'Failed to fetch wiki spells' }, { status: 500 });
  }
}

// POST /api/wiki-spells - Create a new wiki spell
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [newSpell] = await db.insert(wikiArticles).values({
      title: body.name,
      contentType: 'spell',
      wikiUrl: body.wiki_url || body.wikiUrl,
      rawContent: body.rawContent || '',
      parsedData: body.parsedData || {},
      importedFrom: body.imported_from || 'wiki',
    }).returning();

    return NextResponse.json(newSpell, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki spell:', error);
    return NextResponse.json({ error: 'Failed to create wiki spell' }, { status: 500 });
  }
}