import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { campaigns, quests, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatUIDate } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  Star,
  Edit,
  View,
} from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface AdventureQuestsPageProps {
  params: Promise<{ id: string; adventureId: string }>;
}

async function getCampaign(campaignId: number) {
  const [campaign] = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return campaign;
}

async function getAdventure(campaignId: number, adventureId: number) {
  const [adventure] = await db
    .select({
      id: adventures.id,
      campaignId: adventures.campaignId,
      title: adventures.title,
      description: adventures.description,
      status: adventures.status,
      startDate: adventures.startDate,
      endDate: adventures.endDate,
    })
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure || adventure.campaignId !== campaignId) return null;

  return adventure;
}

async function getQuestsForAdventure(adventureId: number) {
  const questsList = await db
    .select()
    .from(quests)
    .where(eq(quests.adventureId, adventureId))
    .orderBy(quests.createdAt);

  return questsList;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "active":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "failed":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/70" />;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case "high":
      return <Flag className="w-4 h-4 text-red-500" />;
    case "medium":
      return <Flag className="w-4 h-4 text-yellow-500" />;
    case "low":
      return <Flag className="w-4 h-4 text-green-500" />;
    default:
      return <Flag className="w-4 h-4 text-base-content/70" />;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "main":
      return <Star className="w-4 h-4 text-yellow-500" />;
    case "side":
      return <Clock className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/70" />;
  }
}

export default async function AdventureQuestsPage({
  params,
}: AdventureQuestsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);

  const campaign = await getCampaign(campaignId);
  const adventure = await getAdventure(campaignId, adventureId);

  if (!campaign || !adventure) {
    notFound();
  }

  const questsList = await getQuestsForAdventure(adventureId);

  return (
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
          { label: "Quests" },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Adventure Quests</h1>
            <p className="text-base-content/70">
              {adventure.title} • Manage quests and objectives for this
              adventure
            </p>
          </div>
          <Link
            href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/create`}
          >
            <Button className="gap-2" variant="primary">
              <Plus className="w-4 h-4" />
              Create Quest
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {questsList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <CheckCircle className="w-12 h-12 mx-auto text-base-content/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Quests Yet</h3>
              <p className="text-base-content/70 mb-4">
                Start creating quests to track objectives and storylines for
                this adventure.
              </p>
              <Link
                href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/create`}
              >
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Quest
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questsList.map((quest) => (
              <Card
                key={quest.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(quest.status || "active")}
                      <Badge
                        variant={
                          quest.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {quest.status || "active"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(quest.priority || "medium")}
                      {getTypeIcon(quest.type || "main")}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {quest.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {quest.description && (
                    <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
                      {quest.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-base-content/70 mb-3">
                    <span className="capitalize">
                      {quest.type || "main"} quest
                    </span>
                    <span className="capitalize">
                      {quest.priority || "medium"} priority
                    </span>
                  </div>

                  {quest.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-base-content/70 mb-3">
                      <Clock className="w-3 h-3" />
                      Due: {formatUIDate(quest.dueDate)}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${quest.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="warning"
                        className="gap-2 w-full"
                        size="sm"
                      >
                        <View className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>
                    <Link
                      href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${quest.id}/edit`}
                    >
                      <Button variant="secondary" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AdventureQuestsPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);
  const adventure = await getAdventure(campaignId, adventureId);

  return {
    title: adventure ? `Quests | ${adventure.title}` : "Adventure Quests",
    description: adventure
      ? `Manage quests for ${adventure.title}`
      : "Manage adventure quests",
  };
}
