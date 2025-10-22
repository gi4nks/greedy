import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, campaigns, gameEditions, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SessionForm from "@/components/session/SessionForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

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

export default async function EditSessionPage({
  params,
}: EditSessionPageProps) {
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
      <div className="container mx-auto px-4 py-6 md:p-6">
        <DynamicBreadcrumb
          campaignId={campaignId}
          sectionItems={[
            { label: "Sessions", href: `/campaigns/${campaignId}/sessions` },
            {
              label: session.title,
              href: `/campaigns/${campaignId}/sessions/${sessionId}`,
            },
            { label: "Edit" },
          ]}
        />

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Edit Session</h1>
              <p className="text-base-content/70">Update session details</p>
            </div>
          </div>
        </div>

        <SessionForm
          session={session}
          campaignId={campaignId}
          adventures={campaignAdventures}
          mode="edit"
        />
      </div>
    </Suspense>
  );
}

function EditSessionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-8 w-8 rounded-lg"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-8 w-64 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="skeleton h-10 w-full"></div>
              <div className="skeleton h-10 w-full"></div>
            </div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-32 w-full mb-4"></div>
            <div className="flex gap-4 justify-end">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditSessionPageProps) {
  const resolvedParams = await params;
  const session = await getSession(parseInt(resolvedParams.sessionId));

  return {
    title: session ? `Edit ${session.title}` : "Edit Session",
    description: session
      ? `Edit session details for ${session.title}`
      : "Edit session details",
  };
}
