import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { campaigns, adventures, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus, Calendar, Users, Trash2 } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { deleteAdventureAction } from '@/lib/actions/adventures';
import { AdventuresList } from '@/components/adventures/AdventuresList';

interface AdventuresPageProps {
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
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  const adventures = await getAdventures(campaignId);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          { label: 'Adventures' }
        ]}
      />
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Adventures</h1>
            <p className="text-base-content/70">
              {campaign.title} • Manage your campaign adventures and story arcs
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/adventures/create`}>
            <Button className="gap-2" variant="primary">
              <Plus className="w-4 h-4" />
              Create Adventure
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<AdventuresListSkeleton />}>
        <AdventuresList adventures={adventures} campaignId={campaignId} />
      </Suspense>
    </div>
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
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `${campaign.title} - Adventures | Adventure Diary` : 'Adventures Not Found',
    description: 'Manage your D&D campaign adventures and story arcs',
  };
}