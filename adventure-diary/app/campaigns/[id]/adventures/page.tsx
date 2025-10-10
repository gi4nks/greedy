import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { adventures, campaigns, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus, Calendar, Users, Trash2 } from 'lucide-react';
import { deleteAdventureAction } from '@/lib/actions/adventures';
import { AdventuresList } from '@/components/adventures/AdventuresList';
import { CampaignPageLayout } from '@/components/layout/CampaignPageLayout';
import { getCampaignWithEdition } from '@/lib/utils/campaign';
import { generateCampaignPageMetadata } from '@/lib/utils/metadata';

interface AdventuresPageProps {
  params: Promise<{ id: string }>;
}

async function getAdventures(campaignId: number) {
  const adventuresList = await db
    .select()
    .from(adventures)
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(adventures.createdAt);

  return adventuresList;
}

async function getAdventures(campaignId: number) {
  const adventuresList = await db
    .select()
    .from(adventures)
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(adventures.createdAt);

  return adventuresList;
}

export default async function AdventuresPage({ params }: AdventuresPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaignWithEdition(campaignId);

  if (!campaign) {
    notFound();
  }

  const adventures = await getAdventures(campaignId);

  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Adventures"
      description="Manage your campaign adventures and story arcs"
      sectionItems={[{ label: 'Adventures' }]}
      createButton={{
        href: `/campaigns/${campaignId}/adventures/create`,
        label: 'Create Adventure',
        icon: <Plus className="w-4 h-4" />
      }}
    >
      <Suspense fallback={<AdventuresListSkeleton />}>
        <AdventuresList adventures={adventures} campaignId={campaignId} />
      </Suspense>
    </CampaignPageLayout>
  );
}

function AdventuresListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-12 w-full mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AdventuresPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaignWithEdition(parseInt(resolvedParams.id));

  return generateCampaignPageMetadata(campaign, 'Adventures', 'Manage your D&D campaign adventures and story arcs');
}