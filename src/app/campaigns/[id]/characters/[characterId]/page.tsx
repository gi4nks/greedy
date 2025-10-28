import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCharacterWithAllEntities } from "@/lib/db/queries";
import CharacterDetail from "@/components/character/CharacterDetail";
import CharacterStats from "@/components/character/CharacterStats";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import CollapsibleSection from "@/components/ui/collapsible-section";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { EntitySidebar } from "@/components/ui/entity-sidebar";
import CharacterDiaryWrapper from "@/components/character/CharacterDiaryWrapper";
import EntityRelationships from "@/components/ui/entity-relationships";
import { getEntityRelationships } from "@/lib/actions/relationships";
import { EntityErrorBoundary } from "@/components/ui/error-boundary";
import { EntityDetailSkeleton, CharacterDetailSkeleton, CharacterStatsSkeleton } from "@/components/ui/loading-skeleton";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  // Fetch relationships
  const relationships = await getEntityRelationships(characterId, "character", campaignId);

  return (
    <EntityErrorBoundary entityType="character">
      <PageContainer>
        <PageHeader
          breadcrumb={{
            campaignId: campaignId,
            campaignTitle: character.campaign?.title || undefined,
            sectionItems: [
              { label: "Characters", href: `/campaigns/${campaignId}/characters` },
              { label: character.name },
            ],
          }}
          title={character.name}
          subtitle={character.description || undefined}
          actions={
            <Link href={`/campaigns/${campaignId}/characters/${characterId}/edit`}>
              <Button variant="secondary" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Character Details */}
            <CollapsibleSection title="Character Details" defaultExpanded={true}>
              <Suspense fallback={<CharacterDetailSkeleton />}>
                <CharacterDetail character={character} />
              </Suspense>
            </CollapsibleSection>

            {/* Stats & Abilities */}
            <CollapsibleSection title="Stats & Abilities" defaultExpanded={false}>
              <Suspense fallback={<CharacterStatsSkeleton />}>
                <CharacterStats character={character} />
              </Suspense>
            </CollapsibleSection>

            {/* Character Journey - Central Feature */}
            <CharacterDiaryWrapper
              characterId={character.id}
              campaignId={campaignId}
            />

            {/* Images */}
            <CollapsibleSection title="Images" defaultExpanded={false}>
              <EntityImageCarousel
                images={parseImagesJson(character.images)}
                entityType="characters"
                className="max-w-2xl mx-auto"
              />
            </CollapsibleSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntitySidebar
              metadata={{
                createdAt: character.createdAt,
                updatedAt: character.updatedAt,
                campaign: character.campaign ? {
                  id: character.campaign.id,
                  title: character.campaign.title,
                } : null,
              }}
            />

            <EntityRelationships
              entityId={character.id.toString()}
              entityType="character"
              relationships={relationships}
              campaignId={campaignId.toString()}
            />
          </div>
        </div>
      </PageContainer>
    </EntityErrorBoundary>
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
