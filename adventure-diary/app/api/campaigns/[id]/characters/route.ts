import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, characterMagicItems, magicItems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    const campaignCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        race: characters.race,
        level: characters.level,
        role: characters.role,
        magicItems: sql<string>`json_group_array(
          json_object(
            'id', ${magicItems.id},
            'name', ${magicItems.name},
            'rarity', ${magicItems.rarity},
            'type', ${magicItems.type}
          )
        )`.as('magicItems')
      })
      .from(characters)
      .leftJoin(characterMagicItems, eq(characters.id, characterMagicItems.characterId))
      .leftJoin(magicItems, eq(characterMagicItems.magicItemId, magicItems.id))
      .where(eq(characters.campaignId, campaignId))
      .groupBy(characters.id)
      .orderBy(characters.name);

    // Parse the magic items JSON and filter out null entries
    const charactersWithMagicItems = campaignCharacters.map((character: any) => ({
      ...character,
      magicItems: character.magicItems 
        ? JSON.parse(character.magicItems).filter((item: any) => item.id !== null)
        : []
    }));

    return NextResponse.json(charactersWithMagicItems);
  } catch (error) {
    console.error('Failed to fetch campaign characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}