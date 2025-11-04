import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/actions/sessions";
import { SessionHeader } from "@/components/session/SessionHeader";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { getCampaignWithEdition } from "@/lib/utils/campaign";
import { db } from "@/lib/db";
import { adventures, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import { EntityErrorBoundary } from "@/components/ui/error-boundary";
import { EntityDetailSkeleton } from "@/components/ui/loading-skeleton";

interface SessionPageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

async function checkSessionBelongsToCampaign(sessionId: number, campaignId: number): Promise<boolean> {
  // Get the adventure ID for this session
  const [sessionData] = await db
    .select({ adventureId: sessions.adventureId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!sessionData?.adventureId) {
    return false;
  }

  // Check if the adventure belongs to the campaign
  const [adventureData] = await db
    .select({ campaignId: adventures.campaignId })
    .from(adventures)
    .where(eq(adventures.id, sessionData.adventureId))
    .limit(1);

  return adventureData?.campaignId === campaignId;
}

async function SessionContent({ sessionId, campaignId }: { sessionId: number; campaignId: number }) {
  const session = await getSession(sessionId);
  const campaign = await getCampaignWithEdition(campaignId);

  if (!session || !campaign) {
    notFound();
  }

  // Check if session belongs to this campaign either directly or through adventure
  const belongsToCampaign = session.campaignId === campaignId || 
    (session.adventureId && await checkSessionBelongsToCampaign(sessionId, campaignId));

  if (!belongsToCampaign) {
    notFound();
  }

  // Always use campaign-level breadcrumb, never include adventure
  // (Sessions are accessed via /campaigns/{id}/sessions, not through adventures)
  const sectionItems = [
    {
      label: "Sessions",
      href: `/campaigns/${campaignId}/sessions`,
    },
    { label: session.title || `Session ${sessionId}` },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={sectionItems}
      />

      <SessionHeader 
        session={session} 
        campaignId={campaignId}
      />

      {/* Image Carousel */}
      <div className="mb-8">
        <ImageCarousel
          images={parseImagesJson(session.images)}
          className="max-w-lg mx-auto"
        />
      </div>
    </div>
  );
}

export default async function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const sessionId = parseInt(resolvedParams.sessionId);

  if (isNaN(campaignId) || isNaN(sessionId)) {
    notFound();
  }

  return (
    <EntityErrorBoundary entityType="session">
      <div className="container mx-auto px-4 py-6 md:p-6">
        <Suspense fallback={<EntityDetailSkeleton />}>
          <SessionContent sessionId={sessionId} campaignId={campaignId} />
        </Suspense>
      </div>
    </EntityErrorBoundary>
  );
}
