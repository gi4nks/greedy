import { notFound } from "next/navigation";
import { CampaignNetworkPageClient } from "@/components/campaign/CampaignNetworkPageClient";
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

  return <CampaignNetworkPageClient campaign={campaign} campaignId={campaignId} />;
}
