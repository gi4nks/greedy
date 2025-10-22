import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adventures, campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AdventureForm from "@/components/adventure/AdventureForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Map } from "lucide-react";

interface EditAdventurePageProps {
  params: Promise<{ id: string; adventureId: string }>;
}

async function getAdventure(adventureId: number) {
  const [adventure] = await db
    .select()
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure) return null;

  return adventure;
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

export default async function EditAdventurePage({
  params,
}: EditAdventurePageProps) {
  const resolvedParams = await params;
  const adventureId = parseInt(resolvedParams.adventureId);
  const campaignId = parseInt(resolvedParams.id);

  const adventure = await getAdventure(adventureId);
  const campaign = await getCampaign(campaignId);

  if (!adventure || !campaign || adventure.campaignId !== campaignId) {
    notFound();
  }

  return (
    <Suspense fallback={<EditAdventureSkeleton />}>
      <div className="container mx-auto px-4 py-6 md:p-6">
        {/* Breadcrumb */}
        <DynamicBreadcrumb
          campaignId={campaignId}
          campaignTitle={campaign.title}
          sectionItems={[
            { label: "Adventures", href: `/campaigns/${campaignId}/adventures` },
            {
              label: adventure.title,
              href: `/campaigns/${campaignId}/adventures/${adventureId}`,
            },
            { label: "Edit" },
          ]}
        />

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Edit Adventure</h1>
              <p className="text-base-content/70">Update adventure details and settings.</p>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Adventure Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AdventureForm
              adventure={adventure}
              campaignId={campaignId}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}

function EditAdventureSkeleton() {
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

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-32 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="skeleton h-10 w-full"></div>
              <div className="skeleton h-10 w-full"></div>
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditAdventurePageProps) {
  const resolvedParams = await params;
  const adventure = await getAdventure(parseInt(resolvedParams.adventureId));

  return {
    title: adventure ? `Edit ${adventure.title}` : "Edit Adventure",
    description:
      adventure?.description || `Edit ${adventure?.title} adventure details`,
  };
}
