import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { campaigns, characters, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { CharactersList } from '@/components/characters/CharactersList';

interface CharactersPageProps {
  params: Promise<{ id: string }>;
}

async function getCampaign(campaignId: number) {
  const [campaign] = await db
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
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return campaign;
}

async function getCharacters(campaignId: number) {
  const characterList = await db
    .select()
    .from(characters)
    .where(eq(characters.campaignId, campaignId))
    .orderBy(characters.name);

  return characterList;
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);

  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  const characters = await getCharacters(campaignId);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          { label: 'Characters' }
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Characters</h1>
            <p className="text-base-content/70">
              {campaign.title} • Manage your player characters and NPCs
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/characters/create`}>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Character
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <CharactersList characters={characters} campaignId={campaignId} />
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharactersPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `${campaign.title} - Characters | Adventure Diary` : 'Characters Not Found',
    description: 'Manage your D&D campaign characters',
  };
}
