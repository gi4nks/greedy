import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { quests, adventures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { QuestsList } from '@/components/quests/QuestsList';
import { CampaignPageLayout } from '@/components/layout/CampaignPageLayout';
import { getCampaignWithEdition } from '@/lib/utils/campaign';
import { generateCampaignPageMetadata } from '@/lib/utils/metadata';

interface QuestsPageProps {
  params: Promise<{ id: string }>;
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
  const campaign = await getCampaignWithEdition(campaignId);

  if (!campaign) {
    notFound();
  }

  const questsData = await getQuests(campaignId);

  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Quests"
      description="Manage campaign quests and objectives"
      sectionItems={[{ label: 'Quests' }]}
      createButton={{
        href: `/campaigns/${campaignId}/quests/create`,
        label: 'Create Quest',
        icon: <Plus className="w-4 h-4" />
      }}
    >
      <QuestsList questsData={questsData} campaignId={campaignId} />
    </CampaignPageLayout>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: QuestsPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaignWithEdition(parseInt(resolvedParams.id));

  return generateCampaignPageMetadata(campaign, 'Quests', 'Manage your D&D campaign quests and objectives');
}