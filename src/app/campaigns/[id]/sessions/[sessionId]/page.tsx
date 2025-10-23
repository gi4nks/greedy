import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/actions/sessions";
import { SessionHeader } from "@/components/session/SessionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import { getCampaignWithEdition } from "@/lib/utils/campaign";
import { db } from "@/lib/db";
import { adventures, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          {
            label: "Sessions",
            href: `/campaigns/${campaignId}/sessions`,
          },
          { label: session.title || `Session ${sessionId}` },
        ]}
      />

      <SessionHeader session={session} />

      {/* Image Carousel */}
      <div className="mb-8">
        <ImageCarousel
          images={parseImagesJson(session.images)}
          className="max-w-2xl mx-auto"
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
    <div className="container mx-auto px-4 py-6 md:p-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        }
      >
        <SessionContent sessionId={sessionId} campaignId={campaignId} />
      </Suspense>
    </div>
  );
}