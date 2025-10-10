import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { campaigns, gameEditions, adventures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import QuestForm from '@/components/quest/QuestForm';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';

interface CreateQuestPageProps {
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

async function getAdventures(campaignId: number) {
  return await db
    .select()
    .from(adventures)
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(adventures.startDate);
}

export default async function CreateQuestPage({ params }: CreateQuestPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  const campaignAdventures = await getAdventures(campaignId);

  return (
    <Suspense fallback={<CreateQuestSkeleton />}>
      <DynamicBreadcrumb
        campaignId={campaignId}
        sectionItems={[
          { label: 'Quests', href: `/campaigns/${campaignId}/quests` },
          { label: 'Create' }
        ]}
      />
      <QuestForm
        campaignId={campaignId}
        adventures={campaignAdventures}
        mode="create"
      />
    </Suspense>
  );
}

function CreateQuestSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="space-y-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
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

        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CreateQuestPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `Create Quest | ${campaign.title}` : 'Create Quest',
    description: 'Create a new quest for your D&D campaign',
  };
}