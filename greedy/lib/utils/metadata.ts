import { Metadata } from "next";
import { CampaignWithEdition } from "@/lib/utils/campaign";

export function generateCampaignPageMetadata(
  campaign: CampaignWithEdition | undefined,
  pageTitle: string,
  description: string,
): Metadata {
  return {
    title: campaign
      ? `${campaign.title} - ${pageTitle} | Adventure Diary`
      : `${pageTitle} Not Found`,
    description,
  };
}
