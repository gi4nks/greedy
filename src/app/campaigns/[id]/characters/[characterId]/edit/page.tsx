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
  characterDiaryEntries,
} from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import CharacterForm from "@/components/character/CharacterForm";
import { Card, CardContent } from "@/components/ui/card";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { WikiDataService } from "@/lib/services/wiki-data";
import { WikiEntity } from "@/lib/types/wiki";
import { updateCharacter } from "@/lib/actions/characters";

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
      background: characters.background,
      alignment: characters.alignment,
      strength: characters.strength,
      dexterity: characters.dexterity,
      constitution: characters.constitution,
      intelligence: characters.intelligence,
      wisdom: characters.wisdom,
      charisma: characters.charisma,
      hitPoints: characters.hitPoints,
      maxHitPoints: characters.maxHitPoints,
      armorClass: characters.armorClass,
      classes: characters.classes,
      description: characters.description,
      images: characters.images,
      tags: characters.tags,
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
            'importedFrom', ${wikiArticles.importedFrom},
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

  // Apply content conversion for AD&D 2e wiki articles
  const processedWikiEntities = parsedWikiEntities.map((entity: WikiEntity) => ({
    ...entity,
    description: entity.importedFrom === "adnd2e-wiki"
      ? WikiDataService.wikitextToHtml(entity.description || "")
      : entity.description,
  }));

  const characterWithParsedEntities = {
    ...character,
    magicItems: magicItemAssignmentsForCharacter,
    wikiEntities: processedWikiEntities,
  };

  // Fetch diary entries directly from database
  const diaryEntriesFromDb = await db
    .select()
    .from(characterDiaryEntries)
    .where(eq(characterDiaryEntries.characterId, characterId))
    .orderBy(characterDiaryEntries.date);

  // Parse JSON fields and normalize types
  const diaryEntries = diaryEntriesFromDb.map(entry => ({
    id: entry.id,
    characterId: entry.characterId,
    description: entry.description,
    date: entry.date,
    linkedEntities: entry.linkedEntities ? JSON.parse(entry.linkedEntities as string) : [],
    isImportant: entry.isImportant ?? false,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));

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
    diaryEntries,
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

  // Create a wrapper action that binds the character ID
  const updateCharacterAction = async (
    prevState: { success: boolean; error?: string },
    formData: FormData,
  ) => {
    "use server";
    return updateCharacter(characterIdNum, prevState, formData);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
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

      <Card className="w-full">
        <CardContent className="p-6">
          <CharacterForm
            character={character}
            campaignId={campaignId}
            adventureId={character.adventureId || undefined}
            mode="edit"
            action={updateCharacterAction}
          />
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
