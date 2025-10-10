import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { campaigns, locations, adventures, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { LocationsList } from '@/components/locations/LocationsList';

interface LocationsPageProps {
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

async function getLocations(campaignId: number) {
  // Get locations through adventures that belong to this campaign
  const locationList = await db
    .select({
      id: locations.id,
      adventureId: locations.adventureId,
      name: locations.name,
      description: locations.description,
      notes: locations.notes,
      tags: locations.tags,
      images: locations.images,
      createdAt: locations.createdAt,
      updatedAt: locations.updatedAt,
    })
    .from(locations)
    .innerJoin(adventures, eq(locations.adventureId, adventures.id))
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(locations.name);

  return locationList;
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  const locations = await getLocations(campaignId);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          { label: 'Locations' }
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Locations</h1>
            <p className="text-base-content/70">
              {campaign.title} • Manage campaign locations and points of interest
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/locations/create`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<LocationsListSkeleton />}>
        <LocationsList locations={locations} campaignId={campaignId} />
      </Suspense>
    </div>
  );
}

function LocationsListSkeleton() {
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
export async function generateMetadata({ params }: LocationsPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `${campaign.title} - Locations | Adventure Diary` : 'Locations Not Found',
    description: 'Manage your D&D campaign locations and points of interest',
  };
}