import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { campaigns, gameEditions, quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import CampaignPageClient from "./campaign-page-client";

interface CampaignData {
  id: number;
  gameEditionId: number | null;
  gameEditionName: string | null;
  gameEditionVersion: string | null;
  title: string;
  description: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  questCount: number;
}

async function getCampaign(campaignId: number): Promise<CampaignData | null> {
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
    })
    .from(campaigns)
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) return null;

  // Get quest count for this campaign
  const questsList = await db
    .select({ id: quests.id })
    .from(quests)
    .innerJoin(adventures, eq(quests.adventureId, adventures.id))
    .where(eq(adventures.campaignId, campaignId));

  const questCount = questsList.length;

  return {
    ...campaign,
    questCount: Number(questCount),
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return <CampaignPageClient campaign={campaign} campaignId={campaignId} />;
}
