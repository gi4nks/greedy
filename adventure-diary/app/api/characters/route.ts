import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, characterMagicItems, magicItems } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all characters with their assigned magic items
    const allCharacters = await db
      .select({
        id: characters.id,
        name: characters.name,
        race: characters.race,
        level: characters.level,
        role: characters.role,
        campaignId: characters.campaignId,
        adventureId: characters.adventureId,
        characterType: characters.characterType,
        equipment: characters.equipment,
        magicItems: sql<string>`json_group_array(
          json_object(
            'id', ${magicItems.id},
            'name', ${magicItems.name},
            'rarity', ${magicItems.rarity},
            'type', ${magicItems.type},
            'description', ${magicItems.description}
          )
        )`.as('magicItems')
      })
      .from(characters)
      .leftJoin(characterMagicItems, eq(characters.id, characterMagicItems.characterId))
      .leftJoin(magicItems, eq(characterMagicItems.magicItemId, magicItems.id))
      .groupBy(characters.id)
      .orderBy(characters.name);

    // Parse the magic items JSON and filter out null entries
    const charactersWithMagicItems = allCharacters.map((character: any) => ({
      ...character,
      equipment: character.equipment ? JSON.parse(character.equipment) : [],
      magicItems: character.magicItems 
        ? JSON.parse(character.magicItems).filter((item: any) => item.id !== null)
        : []
    }));

    return NextResponse.json(charactersWithMagicItems);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}