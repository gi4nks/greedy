import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { LocationsList } from '@/components/locations/LocationsList';
import { CampaignPageLayout } from '@/components/layout/CampaignPageLayout';
import { getCampaignWithEdition } from '@/lib/utils/campaign';
import { generateCampaignPageMetadata } from '@/lib/utils/metadata';

interface LocationsPageProps {
  params: Promise<{ id: string }>;
}

async function getLocations(campaignId: number) {
  const locationList = await db
    .select({
      id: locations.id,
      campaignId: locations.campaignId,
      adventureId: locations.adventureId,
      name: locations.name,
      description: locations.description,
      tags: locations.tags,
      images: locations.images,
      createdAt: locations.createdAt,
      updatedAt: locations.updatedAt,
    })
    .from(locations)
    .where(eq(locations.campaignId, campaignId))
    .orderBy(locations.name);

  return locationList;
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaignWithEdition(campaignId);

  if (!campaign) {
    notFound();
  }

  const locations = await getLocations(campaignId);

  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Locations"
      description="Manage campaign locations and points of interest"
      sectionItems={[{ label: 'Locations' }]}
      createButton={{
        href: `/campaigns/${campaignId}/locations/create`,
        label: 'Add Location',
        icon: <Plus className="w-4 h-4" />
      }}
    >
      <Suspense fallback={<LocationsListSkeleton />}>
        <LocationsList locations={locations} campaignId={campaignId} />
      </Suspense>
    </CampaignPageLayout>
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
  const campaign = await getCampaignWithEdition(parseInt(resolvedParams.id));

  return generateCampaignPageMetadata(campaign, 'Locations', 'Manage your D&D campaign locations and points of interest');
}