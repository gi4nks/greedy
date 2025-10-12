import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { campaigns, gameEditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import CampaignForm from '@/components/campaign/CampaignForm';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';

interface EditCampaignPageProps {
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

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <Suspense fallback={<EditCampaignSkeleton />}>
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.title, href: `/campaigns/${campaignId}` },
          { label: 'Edit' }
        ]}
      />

      <CampaignForm
        campaign={campaign}
      />
    </Suspense>
  );
}

function EditCampaignSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="space-y-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditCampaignPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `Edit ${campaign.title}` : 'Edit Campaign',
    description: campaign?.description || `Edit ${campaign?.title} campaign details`,
  };
}