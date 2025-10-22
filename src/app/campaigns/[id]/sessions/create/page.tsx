import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { campaigns, gameEditions, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SessionForm from "@/components/session/SessionForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, EyeOff } from "lucide-react";
import { Calendar } from "lucide-react";

interface CreateSessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adventureId?: string }>;
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

async function getAdventure(adventureId: number) {
  const [adventure] = await db
    .select({
      id: adventures.id,
      title: adventures.title,
    })
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  return adventure;
}

async function getAdventures(campaignId: number) {
  return await db
    .select()
    .from(adventures)
    .where(eq(adventures.campaignId, campaignId))
    .orderBy(adventures.startDate);
}

export default async function CreateSessionPage({
  params,
  searchParams,
}: CreateSessionPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = resolvedSearchParams.adventureId
    ? parseInt(resolvedSearchParams.adventureId)
    : undefined;

  const campaign = await getCampaign(campaignId);
  const adventure = adventureId ? await getAdventure(adventureId) : null;

  if (!campaign) {
    notFound();
  }

  const campaignAdventures = await getAdventures(campaignId);

  return (
    <Suspense fallback={<CreateSessionSkeleton />}>
      <div className="container mx-auto px-4 py-6 md:p-6">
        <DynamicBreadcrumb
          campaignId={campaignId}
          campaignTitle={campaign.title}
          sectionItems={
            adventure
              ? [
                  {
                    label: "Adventures",
                    href: `/campaigns/${campaignId}/adventures`,
                  },
                  {
                    label: adventure.title,
                    href: `/campaigns/${campaignId}/adventures/${adventure.id}`,
                  },
                  {
                    label: "Sessions",
                    href: `/campaigns/${campaignId}/sessions?adventure=${adventure.id}`,
                  },
                  { label: "Create" },
                ]
              : [
                  {
                    label: "Sessions",
                    href: `/campaigns/${campaignId}/sessions`,
                  },
                  { label: "Create" },
                ]
          }
        />

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Create New Session</h1>
              <p className="text-base-content/70">Record a new gaming session for your campaign</p>
            </div>
          </div>
        </div>

        <SessionForm
          campaignId={campaignId}
          adventures={campaignAdventures}
          mode="create"
          defaultAdventureId={adventureId}
        />
      </div>
    </Suspense>
  );
}

function CreateSessionSkeleton() {
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
export async function generateMetadata({ params }: CreateSessionPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `Create Session | ${campaign.title}` : "Create Session",
    description: "Create a new session for your D&D campaign",
  };
}
