import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  campaigns,
  quests,
  adventures,
  gameEditions,
  wikiArticleEntities,
  wikiArticles,
  magicItems,
  magicItemAssignments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Edit, Calendar, User, Flag, AlertTriangle, CheckCircle, Clock, Play } from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { formatDate, formatUIDate } from "@/lib/utils/date";

interface QuestPageProps {
  params: Promise<{ id: string; adventureId: string; questId: string }>;
}

interface QuestData {
  id: number;
  title: string;
  description: string | null;
  adventureId: number | null;
  status: string | null;
  priority: string | null;
  type: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
  adventure: {
    id: number;
    title: string;
    campaignId: number | null;
  } | null;
  campaign: {
    id: number;
    title: string;
    gameEditionName: string | null;
    gameEditionVersion: string | null;
  };
  wikiEntities: WikiEntity[];
}

async function getQuestData(campaignId: number, adventureId: number, questId: number): Promise<QuestData | null> {
  // Get quest with related data
  const questResult = await db
    .select({
      quest: quests,
      adventure: {
        id: adventures.id,
        title: adventures.title,
        campaignId: adventures.campaignId,
      },
      campaign: {
        id: campaigns.id,
        title: campaigns.title,
        gameEditionName: gameEditions.name,
        gameEditionVersion: gameEditions.version,
      },
    })
    .from(quests)
    .leftJoin(adventures, eq(quests.adventureId, adventures.id))
    .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
    .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
    .where(eq(quests.id, questId))
    .limit(1);

  if (!questResult[0]) return null;

  const { quest, adventure, campaign } = questResult[0];

  // Verify quest belongs to the specified adventure and campaign
  if (quest.adventureId !== adventureId || adventure?.campaignId !== campaignId) {
    return null;
  }

  // Get wiki entities
  const wikiEntitiesResult = await db
    .select({
      id: wikiArticles.id,
      title: wikiArticles.title,
      contentType: wikiArticles.contentType,
      wikiUrl: wikiArticles.wikiUrl,
    })
    .from(wikiArticleEntities)
    .innerJoin(wikiArticles, eq(wikiArticleEntities.wikiArticleId, wikiArticles.id))
    .where(
      and(
        eq(wikiArticleEntities.entityType, "quest"),
        eq(wikiArticleEntities.entityId, questId)
      )
    );

  return {
    ...quest,
    adventure,
    campaign,
    wikiEntities: wikiEntitiesResult,
  };
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-success" />;
    case "active":
      return <Play className="w-4 h-4 text-primary" />;
    case "failed":
      return <AlertTriangle className="w-4 h-4 text-error" />;
    case "paused":
      return <Clock className="w-4 h-4 text-warning" />;
    default:
      return <Target className="w-4 h-4" />;
  }
}

function getPriorityColor(priority: string | null) {
  switch (priority) {
    case "high":
      return "badge-error";
    case "medium":
      return "badge-warning";
    case "low":
      return "badge-success";
    default:
      return "badge-neutral";
  }
}

function getTypeIcon(type: string | null) {
  switch (type) {
    case "main":
      return <Flag className="w-4 h-4" />;
    case "side":
      return <Target className="w-4 h-4" />;
    case "personal":
      return <User className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
}

export default async function QuestPage({
  params,
}: QuestPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);
  const questId = parseInt(resolvedParams.questId);

  const questData = await getQuestData(campaignId, adventureId, questId);

  if (!questData) {
    notFound();
  }

  const images = parseImagesJson(questData.images);

  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={questData.campaign.title}
        sectionItems={[
          {
            label: "Adventures",
            href: `/campaigns/${campaignId}/adventures`,
          },
          {
            label: questData.adventure?.title || "Adventure",
            href: `/campaigns/${campaignId}/adventures/${adventureId}`,
          },
          {
            label: "Quests",
            href: `/campaigns/${campaignId}/adventures/${adventureId}/quests`,
          },
          { label: questData.title },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon(questData.status)}
          <div>
            <h1 className="text-3xl font-bold">{questData.title}</h1>
            <p className="text-base-content/70">
              Quest in {questData.adventure?.title || "Unknown Adventure"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quest Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <MarkdownRenderer content={questData.description} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Status</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(questData.status)}
                    <span className="capitalize">{questData.status || "Unknown"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Priority</div>
                  <Badge className={getPriorityColor(questData.priority)}>
                    {questData.priority || "Unknown"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Type</div>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(questData.type)}
                    <span className="capitalize">{questData.type || "Unknown"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Assigned To</div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{questData.assignedTo || "Unassigned"}</span>
                  </div>
                </div>
              </div>

              {questData.dueDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Due Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatUIDate(questData.dueDate)}</span>
                  </div>
                </div>
              )}

              {Array.isArray(questData.tags) && questData.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-base-content/70">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {questData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <EntityImageCarousel
                  images={images}
                  entityType="quests"
                  entityId={questData.id}
                />
              </CardContent>
            </Card>
          )}

          {/* Wiki Items */}
          {questData.wikiEntities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Wiki References</CardTitle>
              </CardHeader>
              <CardContent>
                <WikiEntitiesDisplay
                  wikiEntities={questData.wikiEntities}
                  entityType="quest"
                  entityId={questData.id}
                  showImportMessage={false}
                  isEditable={false}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${questId}/edit`}
              >
                <Button className="w-full gap-2" variant="outline">
                  <Edit className="w-4 h-4" />
                  Edit Quest
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium text-base-content/70">Created</div>
                <div className="text-sm">{formatUIDate(questData.createdAt)}</div>
              </div>

              {questData.updatedAt && questData.updatedAt !== questData.createdAt && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Last Updated</div>
                  <div className="text-sm">{formatUIDate(questData.updatedAt)}</div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-sm font-medium text-base-content/70">Campaign</div>
                <Link
                  href={`/campaigns/${campaignId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {questData.campaign.title}
                </Link>
              </div>

              {questData.campaign.gameEditionName && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-base-content/70">Game Edition</div>
                  <div className="text-sm">
                    {questData.campaign.gameEditionName}
                    {questData.campaign.gameEditionVersion && ` (${questData.campaign.gameEditionVersion})`}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuestPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: QuestPageProps) {
  const resolvedParams = await params;
  const questId = parseInt(resolvedParams.questId);

  const quest = await db
    .select()
    .from(quests)
    .where(eq(quests.id, questId))
    .limit(1);

  return {
    title: quest[0] ? `${quest[0].title} | Quest` : "Quest",
    description: quest[0]?.description || `View quest details`,
  };
}