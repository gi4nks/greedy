import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicItems, characterMagicItems, characters } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/magic-items - Get all magic items with their assigned characters
export async function GET() {
  try {
    // Get magic items with their assigned characters
    const items = await db
      .select({
        id: magicItems.id,
        name: magicItems.name,
        rarity: magicItems.rarity,
        type: magicItems.type,
        description: magicItems.description,
        properties: magicItems.properties,
        attunementRequired: magicItems.attunementRequired,
        images: magicItems.images,
        createdAt: magicItems.createdAt,
        updatedAt: magicItems.updatedAt,
        owners: sql<string>`json_group_array(
          json_object(
            'id', ${characters.id},
            'name', ${characters.name},
            'race', ${characters.race},
            'level', ${characters.level}
          )
        )`.as('owners')
      })
      .from(magicItems)
      .leftJoin(characterMagicItems, eq(magicItems.id, characterMagicItems.magicItemId))
      .leftJoin(characters, eq(characterMagicItems.characterId, characters.id))
      .groupBy(magicItems.id)
      .all();

    // Parse the owners JSON and filter out null entries
    const itemsWithOwners = items.map((item: any) => ({
      ...item,
      owners: item.owners 
        ? JSON.parse(item.owners).filter((owner: any) => owner.id !== null)
        : []
    }));

    return NextResponse.json(itemsWithOwners);
  } catch (error) {
    console.error('Error fetching magic items:', error);
    return NextResponse.json({ error: 'Failed to fetch magic items' }, { status: 500 });
  }
}

// POST /api/magic-items - Create a new magic item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const [newItem] = await db.insert(magicItems).values({
      name: body.name,
      rarity: body.rarity,
      type: body.type,
      description: body.description,
      properties: body.properties,
      attunementRequired: body.attunement_required || false,
    }).returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating magic item:', error);
    return NextResponse.json({ error: 'Failed to create magic item' }, { status: 500 });
  }
}