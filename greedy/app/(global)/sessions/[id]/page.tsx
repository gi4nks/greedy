import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/actions/sessions";
import { SessionHeader } from "@/components/session/SessionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

async function SessionContent({ sessionId }: { sessionId: number }) {
  const session = await getSession(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {session.campaignId ? (
        <DynamicBreadcrumb
          campaignId={session.campaignId}
          campaignTitle={session.campaignTitle || undefined}
          sectionItems={[
            { label: 'Sessions', href: `/campaigns/${session.campaignId}/sessions` },
            { label: session.title || `Session ${sessionId}` }
          ]}
        />
      ) : (
        <DynamicBreadcrumb
          items={[
            { label: 'Sessions', href: '/sessions' },
            { label: session.title || `Session ${sessionId}` }
          ]}
        />
      )}

      <SessionHeader session={session} />

      {/* Image Carousel */}
      <div className="mb-8">
        <ImageCarousel
          images={parseImagesJson(session.images)}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
}

export default async function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = await params;
  const sessionId = parseInt(resolvedParams.id);

  if (isNaN(sessionId)) {
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
        <SessionContent sessionId={sessionId} />
      </Suspense>
    </div>
  );
}