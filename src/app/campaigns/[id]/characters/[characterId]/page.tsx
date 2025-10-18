import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCharacterWithAllEntities } from "@/lib/db/queries";
import CharacterDetail from "@/components/character/CharacterDetail";
import CharacterStats from "@/components/character/CharacterStats";
import CharacterActions from "@/components/character/CharacterActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";

interface CharacterPageProps {
  params: Promise<{ id: string; characterId: string }>;
}

async function getCharacterWithEntities(characterId: number) {
  // Use the API to get character with all assigned entities
  const response = await fetch(
    `/api/characters/${characterId}`,
    {
      cache: "no-store", // Ensure fresh data
    },
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getCharacter(characterId: number) {
  return await getCharacterWithAllEntities(characterId);
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
    console.error("Failed to fetch character entities:", error);
  }

  const character =
    characterWithEntities || (await getCharacter(characterIdNum));

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
          { label: "Characters", href: `/campaigns/${campaignId}/characters` },
          { label: character.name },
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
                  {character.characterType === "pc"
                    ? "Player Character"
                    : character.characterType === "npc"
                      ? "NPC"
                      : character.characterType}
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
          entityType="characters"
          className="max-w-2xl mx-auto"
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
    title: character
      ? `${character.name} | Adventure Diary`
      : "Character Not Found",
    description:
      character?.description || `View ${character?.name}'s character sheet`,
  };
}
