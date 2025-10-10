import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicItems, characterMagicItems, characters } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    
    // Get magic item with its assigned characters
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
      .where(eq(magicItems.id, itemId))
      .groupBy(magicItems.id)
      .all();

    if (items.length === 0) {
      return NextResponse.json({ error: 'Magic item not found' }, { status: 404 });
    }

    const item = items[0];
    const itemWithOwners = {
      ...item,
      owners: item.owners 
        ? JSON.parse(item.owners).filter((owner: any) => owner.id !== null)
        : []
    };

    return NextResponse.json(itemWithOwners);
  } catch (error) {
    console.error('Error fetching magic item:', error);
    return NextResponse.json({ error: 'Failed to fetch magic item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    const body = await request.json();
    
    const [updatedItem] = await db
      .update(magicItems)
      .set({
        name: body.name,
        rarity: body.rarity,
        type: body.type,
        description: body.description,
        properties: body.properties,
        attunementRequired: body.attunement_required,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(magicItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Magic item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating magic item:', error);
    return NextResponse.json({ error: 'Failed to update magic item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    
    // Delete character assignments first
    await db.delete(characterMagicItems).where(eq(characterMagicItems.magicItemId, itemId));
    
    // Delete the magic item
    const result = await db.delete(magicItems).where(eq(magicItems.id, itemId)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Magic item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Magic item deleted successfully' });
  } catch (error) {
    console.error('Error deleting magic item:', error);
    return NextResponse.json({ error: 'Failed to delete magic item' }, { status: 500 });
  }
}