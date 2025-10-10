import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { campaigns, adventures, characters } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import CharacterList from '@/components/character/CharacterList';
import CharacterFilters from '@/components/character/CharacterFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface CharactersPageProps {
  params: { id: string };
  searchParams: {
    type?: string;
    race?: string;
    class?: string;
    adventure_id?: string;
  };
}

async function getCampaignWithAdventures(campaignId: number) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) return null;

  const campaignAdventures = await db
    .select()
    .from(adventures)
    .where(eq(adventures.campaignId, campaignId));

  return {
    ...campaign,
    adventures: campaignAdventures,
  };
}

async function getCharacters(campaignId: number, filters: {
  type?: string;
  race?: string;
  class?: string;
  adventure_id?: string;
}) {
  const conditions = [eq(characters.campaignId, campaignId)];

  // Apply filters
  if (filters.type) {
    conditions.push(eq(characters.characterType, filters.type));
  }

  if (filters.race) {
    conditions.push(eq(characters.race, filters.race));
  }

  if (filters.adventure_id) {
    conditions.push(eq(characters.adventureId, Number(filters.adventure_id)));
  }

  const characterList = await db
    .select()
    .from(characters)
    .where(and(...conditions))
    .orderBy(characters.name);

  return characterList;
}

export default async function CharactersPage({ params, searchParams }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaignWithAdventures(campaignId);

  if (!campaign) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const characters = await getCharacters(campaignId, resolvedSearchParams);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Characters</h1>
            <p className="text-base-content/70">
              {campaign.title} • Manage your player characters and NPCs
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/characters/create`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Character
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <CharacterFilters
            campaignId={campaignId}
            adventures={campaign.adventures}
            currentFilters={resolvedSearchParams}
          />
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<CharacterListSkeleton />}>
            <CharacterList
              characters={characters}
              campaignId={campaignId}
              adventures={campaign.adventures}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function CharacterListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="w-20 h-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaignWithAdventures(parseInt(resolvedParams.id));

  return {
    title: campaign ? `${campaign.title} - Characters | Adventure Diary` : 'Characters Not Found',
    description: `Manage characters for the ${campaign?.title} campaign`,
  };
}