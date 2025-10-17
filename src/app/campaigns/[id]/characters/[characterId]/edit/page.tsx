import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  characters,
  adventures,
  campaigns,
  gameEditions,
  magicItems,
  magicItemAssignments,
  wikiArticles,
  wikiArticleEntities,
} from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import CharacterForm from "@/components/character/CharacterForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface EditCharacterPageProps {
  params: Promise<{ id: string; characterId: string }>;
}

async function getCharacter(characterId: number) {
  // Get character with their assigned magic items and wiki entities
  const charactersWithEntities = await db
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
      items: characters.items,
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
      wikiEntities: sql<string>`json_group_array(
        CASE WHEN ${wikiArticles.id} IS NOT NULL THEN
          json_object(
            'id', ${wikiArticles.id},
            'title', ${wikiArticles.title},
            'contentType', ${wikiArticles.contentType},
            'wikiUrl', ${wikiArticles.wikiUrl},
            'description', ${wikiArticles.rawContent},
            'parsedData', ${wikiArticles.parsedData},
            'relationshipType', ${wikiArticleEntities.relationshipType},
            'relationshipData', ${wikiArticleEntities.relationshipData}
          )
        END
      )`.as("wikiEntities"),
    })
    .from(characters)
    .leftJoin(
      wikiArticleEntities,
      and(
        eq(wikiArticleEntities.entityType, "character"),
        eq(wikiArticleEntities.entityId, characters.id),
      ),
    )
    .leftJoin(
      wikiArticles,
      eq(wikiArticleEntities.wikiArticleId, wikiArticles.id),
    )
    .where(eq(characters.id, characterId))
    .groupBy(characters.id);

  if (charactersWithEntities.length === 0) return null;

  const character = charactersWithEntities[0];

  // Parse magic items and filter out nulls
  const magicItemAssignmentsForCharacter = await db
    .select({
      id: magicItems.id,
      assignmentId: magicItemAssignments.id,
      name: magicItems.name,
      rarity: magicItems.rarity,
      type: magicItems.type,
      description: magicItems.description,
      source: magicItemAssignments.source,
      notes: magicItemAssignments.notes,
      metadata: magicItemAssignments.metadata,
      assignedAt: magicItemAssignments.assignedAt,
      campaignId: magicItemAssignments.campaignId,
    })
    .from(magicItemAssignments)
    .innerJoin(magicItems, eq(magicItemAssignments.magicItemId, magicItems.id))
    .where(
      and(
        eq(magicItemAssignments.entityType, "character"),
        eq(magicItemAssignments.entityId, characterId),
      ),
    );

  // Parse wiki entities and filter out nulls
  const parsedWikiEntities = character.wikiEntities
    ? JSON.parse(character.wikiEntities).filter(
        (item: unknown) => item !== null,
      )
    : [];

  // Separate by content type for backward compatibility
  const parsedWikiSpells = parsedWikiEntities.filter(
    (entity: unknown) =>
      (entity as { contentType?: string })?.contentType === "spell",
  );
  const parsedWikiMonsters = parsedWikiEntities.filter(
    (entity: unknown) =>
      (entity as { contentType?: string })?.contentType === "monster",
  );

  const characterWithParsedEntities = {
    ...character,
    magicItems: magicItemAssignmentsForCharacter,
    wikiSpells: parsedWikiSpells,
    wikiMonsters: parsedWikiMonsters,
    wikiEntities: parsedWikiEntities,
  };

  // Get related data
  const [adventure] = characterWithParsedEntities.adventureId
    ? await db
        .select()
        .from(adventures)
        .where(eq(adventures.id, characterWithParsedEntities.adventureId))
        .limit(1)
    : [null];

  const [campaign] = characterWithParsedEntities.campaignId
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
        .where(eq(campaigns.id, characterWithParsedEntities.campaignId))
        .limit(1)
    : [null];

  return {
    ...characterWithParsedEntities,
    adventure,
    campaign,
  };
}

export default async function EditCharacterPage({
  params,
}: EditCharacterPageProps) {
  const { id, characterId } = await params;
  const characterIdNum = parseInt(characterId);
  const campaignId = parseInt(id);
  const character = await getCharacter(characterIdNum);

  if (
    !character ||
    (character.campaign?.id !== campaignId &&
      character.campaignId !== campaignId)
  ) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={character.campaign?.title}
        sectionItems={[
          { label: "Characters", href: `/campaigns/${campaignId}/characters` },
          {
            label: character.name,
            href: `/campaigns/${campaignId}/characters/${characterId}`,
          },
          { label: "Edit" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Character</h1>
        <p className="text-base-content/70 mt-2">
          Update {character.name}&apos;s character details.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <CharacterForm
            character={character}
            campaignId={campaignId}
            adventureId={character.adventureId || undefined}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EditCharacterSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-48" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditCharacterPageProps) {
  const { characterId } = await params;
  const character = await getCharacter(parseInt(characterId));

  return {
    title: character ? `Edit ${character.name}` : "Edit Character",
    description:
      character?.description || `Edit ${character?.name}'s character sheet`,
  };
}
