import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import CampaignForm from "@/components/campaign/CampaignForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { BookOpen } from "lucide-react";

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

export default async function EditCampaignPage({
  params,
}: EditCampaignPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);

  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={[{ label: "Edit" }]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Edit Campaign</h1>
            <p className="text-base-content/70">Update your campaign details and settings.</p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CampaignForm campaign={campaign} />
        </CardContent>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditCampaignPageProps) {
  const resolvedParams = await params;
  const campaign = await getCampaign(parseInt(resolvedParams.id));

  return {
    title: campaign ? `Edit ${campaign.title}` : "Edit Campaign",
    description:
      campaign?.description || `Edit ${campaign?.title} campaign details`,
  };
}
