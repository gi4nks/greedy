import { notFound } from "next/navigation";
import { CampaignNetwork } from "@/components/campaign/CampaignNetwork";
import { CampaignPageLayout } from "@/components/layout/CampaignPageLayout";
import { getCampaignWithEdition } from "@/lib/utils/campaign";

interface CampaignNetworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignNetworkPage({
  params,
}: CampaignNetworkPageProps) {
  const { id } = await params;
  const campaignId = Number(id);

  if (!Number.isInteger(campaignId)) {
    notFound();
  }

  const campaign = await getCampaignWithEdition(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <CampaignPageLayout
      campaign={campaign}
      title="Campaign Network"
      description="Interactive relationship graph"
      sectionItems={[{ label: "Network" }]}
    >
      <CampaignNetwork campaignId={campaignId} />
    </CampaignPageLayout>
  );
}
