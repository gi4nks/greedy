import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { campaigns, quests, adventures, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { QuestsList } from '@/components/quests/QuestsList';

interface QuestsPageProps {
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

  if (!campaign) return null;

  return campaign;
}

async function getQuests(campaignId: number) {
  // Get all quests for adventures in this campaign
  const questsWithAdventures = await db
    .select({
      quest: quests,
      adventure: adventures,
    })
    .from(quests)
    .leftJoin(adventures, eq(quests.adventureId, adventures.id))
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(quests.createdAt);

  return questsWithAdventures;
}

export default async function QuestsPage({ params }: QuestsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  const questsData = await getQuests(campaignId);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Quests</h1>
            <p className="text-base-content/70">
              {campaign.title} • Manage campaign quests and objectives
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/quests/create`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Quest
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <QuestsList questsData={questsData} campaignId={campaignId} />
      </div>
    </div>
  );
}