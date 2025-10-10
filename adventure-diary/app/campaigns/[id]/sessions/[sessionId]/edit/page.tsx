import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { sessions, campaigns, gameEditions, adventures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import SessionForm from '@/components/session/SessionForm';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';

interface EditSessionPageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

async function getSession(sessionId: number) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  return session;
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

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const resolvedParams = await params;
  const sessionId = parseInt(resolvedParams.sessionId);
  const campaignId = parseInt(resolvedParams.id);
  
  const session = await getSession(sessionId);
  const campaign = await getCampaign(campaignId);

  if (!session || !campaign) {
    notFound();
  }

  const campaignAdventures = await getAdventures(campaignId);

  return (
    <Suspense fallback={<EditSessionSkeleton />}>
      <DynamicBreadcrumb
        campaignId={campaignId}
        sectionItems={[
          { label: 'Sessions', href: `/campaigns/${campaignId}/sessions` },
          { label: session.title, href: `/campaigns/${campaignId}/sessions/${sessionId}` },
          { label: 'Edit' }
        ]}
      />
      <SessionForm
        session={session}
        campaignId={campaignId}
        campaignTitle={campaign.title}
        adventures={campaignAdventures}
        mode="edit"
      />
    </Suspense>
  );
}

function EditSessionSkeleton() {
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
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-32 w-full" />
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
export async function generateMetadata({ params }: EditSessionPageProps) {
  const resolvedParams = await params;
  const session = await getSession(parseInt(resolvedParams.sessionId));

  return {
    title: session ? `Edit ${session.title}` : 'Edit Session',
    description: session ? `Edit session details for ${session.title}` : 'Edit session details',
  };
}