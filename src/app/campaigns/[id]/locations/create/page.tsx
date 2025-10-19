import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LocationForm from "@/components/location/LocationForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface CreateLocationPageProps {
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

export default async function CreateLocationPage({
  params,
}: CreateLocationPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 md:p-6 max-w-5xl">
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[
          { label: "Locations", href: `/campaigns/${campaignId}/locations` },
          { label: "Create Location" },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Create New Location</h1>
            <p className="text-base-content/70">Add a new location to your campaign</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<CreateLocationSkeleton />}>
            <LocationForm campaignId={campaignId} mode="create" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateLocationSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-8 w-8 rounded-lg"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-8 w-64 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-20 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-20 w-full mb-4"></div>
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
export async function generateMetadata({ params }: CreateLocationPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `Create Location | ${campaign.title}` : "Create Location",
    description: "Create a new location for your D&D campaign",
  };
}
