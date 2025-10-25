import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCharacterWithAllEntities } from "@/lib/db/queries";
import CharacterDetail from "@/components/character/CharacterDetail";
import CharacterStats from "@/components/character/CharacterStats";
import CharacterDiary from "@/components/character/CharacterDiary";
import CharacterHeroHeader from "@/components/character/CharacterHeroHeader";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import CollapsibleSection from "@/components/ui/collapsible-section";
import CharacterDiaryWrapper from "@/components/character/CharacterDiaryWrapper";

interface CharacterPageProps {
  params: Promise<{ id: string; characterId: string }>;
}

async function getCharacterWithEntities(characterId: number) {
  // Use the database function directly instead of API call
  return await getCharacterWithAllEntities(characterId);
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
    <div className="container mx-auto px-4 py-6 md:p-6 max-w-7xl">
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={character.campaign?.title || undefined}
        sectionItems={[
          { label: "Characters", href: `/campaigns/${campaignId}/characters` },
          { label: character.name },
        ]}
      />

      {/* Hero Header */}
      <CharacterHeroHeader
        character={character}
        campaignId={campaignId}
      />

      {/* Character Details */}
      <CollapsibleSection title="Character Details" className="mb-6">
        <Suspense fallback={<CharacterDetailSkeleton />}>
          <CharacterDetail character={character} />
        </Suspense>
      </CollapsibleSection>

      {/* Stats & Abilities */}
      <CollapsibleSection title="Stats & Abilities" className="mb-6" defaultExpanded={false}>
        <Suspense fallback={<CharacterStatsSkeleton />}>
          <CharacterStats character={character} />
        </Suspense>
      </CollapsibleSection>

      {/* Character Journey - Central Feature */}
      <CharacterDiaryWrapper characterId={character.id} campaignId={campaignId} />

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

function CharacterDiarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-base-300 rounded-lg"></div>
          ))}
        </div>
      </div>
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
