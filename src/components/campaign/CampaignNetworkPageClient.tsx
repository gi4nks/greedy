"use client";

import { EntityNetwork } from "@/components/campaign/EntityNetwork";
import { CampaignPageLayout } from "@/components/layout/CampaignPageLayout";

interface CampaignNetworkPageClientProps {
  campaign: {
    id: number;
    gameEditionId: number | null;
    gameEditionName: string | null;
    gameEditionVersion: string | null;
    title: string;
    description: string | null;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    tags: unknown;
    createdAt: string | null;
    updatedAt: string | null;
  };
  campaignId: number;
}

export function CampaignNetworkPageClient({
  campaign,
  campaignId,
}: CampaignNetworkPageClientProps) {
  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Campaign Network"
      description="Interactive relationship graph"
      sectionItems={[{ label: "Network" }]}
    >
      <EntityNetwork campaignId={campaignId} />
    </CampaignPageLayout>
  );
}