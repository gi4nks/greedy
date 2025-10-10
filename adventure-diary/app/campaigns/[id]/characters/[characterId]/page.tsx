import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { characters, adventures, campaigns, gameEditions, characterMagicItems, magicItems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import CharacterDetail from '@/components/character/CharacterDetail';
import CharacterStats from '@/components/character/CharacterStats';
import CharacterActions from '@/components/character/CharacterActions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { EntityImageCarousel } from '@/components/ui/image-carousel';
import { parseImagesJson } from '@/lib/utils/imageUtils.client';

interface CharacterPageProps {
  params: Promise<{ id: string; characterId: string }>;
}

async function getCharacterWithEntities(characterId: number) {
  // Use the API to get character with all assigned entities
  const response = await fetch(`http://localhost:3000/api/characters/${characterId}`, {
    cache: 'no-store' // Ensure fresh data
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

async function getCharacter(characterId: number) {
  // Get character with their assigned magic items
  const charactersWithMagicItems = await db
    .select({
      id: characters.id,
      campaignId: characters.campaignId,
      adventureId: characters.adventureId,
      characterType: characters.characterType,
      name: characters.name,
      race: characters.race,
      level: characters.level,
      background: characters.background,
      alignment: characters.alignment,
      experience: characters.experience,
      strength: characters.strength,
      dexterity: characters.dexterity,
      constitution: characters.constitution,
      intelligence: characters.intelligence,
      wisdom: characters.wisdom,
      charisma: characters.charisma,
      hitPoints: characters.hitPoints,
      maxHitPoints: characters.maxHitPoints,
      armorClass: characters.armorClass,
      initiative: characters.initiative,
      speed: characters.speed,
      proficiencyBonus: characters.proficiencyBonus,
      savingThrows: characters.savingThrows,
      skills: characters.skills,
      equipment: characters.equipment,
      weapons: characters.weapons,
      spells: characters.spells,
      spellcastingAbility: characters.spellcastingAbility,
      spellSaveDc: characters.spellSaveDc,
      spellAttackBonus: characters.spellAttackBonus,
      personalityTraits: characters.personalityTraits,
      ideals: characters.ideals,
      bonds: characters.bonds,
      flaws: characters.flaws,
      backstory: characters.backstory,
      role: characters.role,
      npcRelationships: characters.npcRelationships,
      classes: characters.classes,
      description: characters.description,
      tags: characters.tags,
      images: characters.images,
      createdAt: characters.createdAt,
      updatedAt: characters.updatedAt,
      magicItems: sql<string>`json_group_array(
        CASE WHEN ${magicItems.id} IS NOT NULL THEN
          json_object(
            'id', ${magicItems.id},
            'name', ${magicItems.name},
            'rarity', ${magicItems.rarity},
            'type', ${magicItems.type},
            'description', ${magicItems.description}
          )
        END
      )`.as('magicItems')
    })
    .from(characters)
    .leftJoin(characterMagicItems, eq(characters.id, characterMagicItems.characterId))
    .leftJoin(magicItems, eq(characterMagicItems.magicItemId, magicItems.id))
    .where(eq(characters.id, characterId))
    .groupBy(characters.id);

  if (charactersWithMagicItems.length === 0) return null;

  const character = charactersWithMagicItems[0];
  
  // Parse magic items and filter out nulls
  const parsedMagicItems = character.magicItems 
    ? JSON.parse(character.magicItems).filter((item: any) => item !== null)
    : [];

  const characterWithParsedMagicItems = {
    ...character,
    magicItems: parsedMagicItems
  };

  // Get related data
  const [adventure] = characterWithParsedMagicItems.adventureId
    ? await db
        .select()
        .from(adventures)
        .where(eq(adventures.id, characterWithParsedMagicItems.adventureId))
        .limit(1)
    : [null];

  // Get campaign data - prefer character's campaignId, fallback to adventure's campaignId
  const campaignIdToUse = characterWithParsedMagicItems.campaignId || adventure?.campaignId;
  const [campaign] = campaignIdToUse
    ? await db
        .select({
          id: campaigns.id,
          gameEditionId: campaigns.gameEditionId,
          gameEditionName: gameEditions.name,
          gameEditionVersion: gameEditions.version,
          title: campaigns.title,
          description: campaigns.description,
          status: campaigns.status,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          tags: campaigns.tags,
          createdAt: campaigns.createdAt,
          updatedAt: campaigns.updatedAt,
        })
        .from(campaigns)
        .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
        .where(eq(campaigns.id, campaignIdToUse))
        .limit(1)
    : [null];

  return {
    ...characterWithParsedMagicItems,
    adventure,
    campaign,
  };
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const { id, characterId } = await params;
  const characterIdNum = parseInt(characterId);
  const campaignId = parseInt(id);
  
  // Get character with all entities
  let characterWithEntities = null;
  try {
    characterWithEntities = await getCharacterWithEntities(characterIdNum);
  } catch (error) {
    console.error('Failed to fetch character entities:', error);
  }
  
  const character = characterWithEntities || await getCharacter(characterIdNum);

  if (!character) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={character.campaign?.title}
        sectionItems={[
          { label: 'Characters', href: `/campaigns/${campaignId}/characters` },
          { label: character.name }
        ]}
      />

      {/* Character Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{character.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-base-content/70">
                {character.campaign?.title} • {character.adventure?.title}
              </p>
              {character.characterType && (
                <Badge variant="outline" className="capitalize">
                  {character.characterType === 'pc' ? 'Player Character' :
                   character.characterType === 'npc' ? 'NPC' :
                   character.characterType}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <CharacterActions character={character} campaignId={campaignId} />
          </div>
        </div>
      </div>

      {/* Character Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<CharacterDetailSkeleton />}>
            <CharacterDetail character={character} />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<CharacterStatsSkeleton />}>
            <CharacterStats character={character} />
          </Suspense>
        </div>
      </div>

      {/* Images */}
      <div className="mt-8">
        <EntityImageCarousel
          images={parseImagesJson(character.images)}
          entityType="character"
        />
      </div>
    </div>
  );
}

function CharacterDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

function CharacterStatsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharacterPageProps) {
  const { characterId } = await params;
  const character = await getCharacter(parseInt(characterId));

  return {
    title: character ? `${character.name} | Adventure Diary` : 'Character Not Found',
    description: character?.description || `View ${character?.name}'s character sheet`,
  };
}