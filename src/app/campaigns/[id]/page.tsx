import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { campaigns, gameEditions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  BookOpen,
  Users,
  MapPin,
  Play,
  Edit,
  Share2,
} from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { formatDisplayDate } from "@/lib/utils/date";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

interface CampaignPageProps {
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
    })
    .from(campaigns)
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  return campaign;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
      />

      {/* Campaign Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge
                variant={campaign.status === "active" ? "default" : "secondary"}
              >
                {campaign.status || "active"}
              </Badge>
              {campaign.gameEditionName && (
                <Badge variant="outline">
                  {campaign.gameEditionName}
                  {campaign.gameEditionVersion &&
                  !campaign.gameEditionName.includes(
                    campaign.gameEditionVersion,
                  )
                    ? ` ${campaign.gameEditionVersion}`
                    : ""}
                </Badge>
              )}
              {campaign.startDate && (
                <div className="flex items-center gap-1 text-sm text-base-content/70">
                  <Calendar className="w-4 h-4" />
                  Started {formatDisplayDate(campaign.startDate)}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/campaigns/${campaignId}/edit`}>
              <Button variant="secondary" className="gap-2" size="sm">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {campaign.description && (
          <div className="text-base-content/70 mt-4 max-w-3xl">
            <MarkdownRenderer
              content={campaign.description}
              className="prose-base"
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href={`/campaigns/${campaignId}/adventures`} className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">Adventures</h3>
              <p className="text-sm text-base-content/70">
                Manage story arcs and modules
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/campaigns/${campaignId}/sessions`} className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Play className="w-8 h-8 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">Sessions</h3>
              <p className="text-sm text-base-content/70">
                Track game sessions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/campaigns/${campaignId}/characters`} className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">Characters</h3>
              <p className="text-sm text-base-content/70">Players and NPCs</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/campaigns/${campaignId}/locations`} className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">Locations</h3>
              <p className="text-sm text-base-content/70">
                Campaign world places
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/campaigns/${campaignId}/network`} className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Share2 className="w-8 h-8 mx-auto mb-3 text-fuchsia-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">Network</h3>
              <p className="text-sm text-base-content/70">
                Visualize entity relationships
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
