import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wikiArticles, wikiArticleEntities, characters } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

type AssignedCharacter = {
  id: number;
  name: string;
  relationshipType: string | null;
  notes: unknown;
};

function parseAssignedCharacters(raw: string | null): AssignedCharacter[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((char): char is AssignedCharacter => {
      return char !== null && typeof char === 'object' && 'id' in char && 'name' in char;
    });
  } catch (err) {
    console.warn('Unable to parse assigned characters', err);
    return [];
  }
}

// GET /api/wiki-monsters - Get all wiki monsters with their assigned characters
export async function GET() {
  try {
    const monsters = await db
      .select({
        id: wikiArticles.id,
        name: wikiArticles.title,
        type: wikiArticles.parsedData,
        challengeRating: wikiArticles.parsedData,
        armorClass: wikiArticles.parsedData,
        hitPoints: wikiArticles.parsedData,
        speed: wikiArticles.parsedData,
        abilities: wikiArticles.parsedData,
        description: wikiArticles.parsedData,
        wikiUrl: wikiArticles.wikiUrl,
        importedFrom: wikiArticles.importedFrom,
        createdAt: wikiArticles.createdAt,
        assignedCharacters: sql<string>`json_group_array(
          CASE WHEN ${characters.id} IS NOT NULL THEN
            json_object(
              'id', ${characters.id},
              'name', ${characters.name},
              'relationshipType', ${wikiArticleEntities.relationshipType},
              'notes', ${wikiArticleEntities.relationshipData}
            )
          END
        )`.as('assignedCharacters')
      })
      .from(wikiArticles)
      .leftJoin(wikiArticleEntities, eq(wikiArticles.id, wikiArticleEntities.wikiArticleId))
      .leftJoin(characters, sql`${wikiArticleEntities.entityType} = 'character' AND ${wikiArticleEntities.entityId} = ${characters.id}`)
      .where(eq(wikiArticles.contentType, 'monster'))
      .groupBy(wikiArticles.id)
      .orderBy(wikiArticles.title);

    type MonsterWithCharacters = (typeof monsters)[number];

    // Parse assigned characters and filter out nulls
    const monstersWithCharacters = monsters.map((monster: MonsterWithCharacters) => ({
      ...monster,
      assignedCharacters: parseAssignedCharacters(monster.assignedCharacters ?? null),
    }));

    return NextResponse.json(monstersWithCharacters);
  } catch (error) {
    console.error('Error fetching wiki monsters:', error);
    return NextResponse.json({ error: 'Failed to fetch wiki monsters' }, { status: 500 });
  }
}

// POST /api/wiki-monsters - Create a new wiki monster
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const [newMonster] = await db.insert(wikiArticles).values({
      title: body.name,
      contentType: 'monster',
      wikiUrl: body.wiki_url || body.wikiUrl,
      rawContent: body.rawContent || '',
      parsedData: body.parsedData || {},
      importedFrom: body.imported_from || 'wiki',
    }).returning();

    return NextResponse.json(newMonster, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki monster:', error);
    return NextResponse.json({ error: 'Failed to create wiki monster' }, { status: 500 });
  }
}