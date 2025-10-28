import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, User, Flag, AlertTriangle, CheckCircle, Clock, Play, Edit } from "lucide-react";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { ImageInfo, parseImagesJson } from "@/lib/utils/imageUtils.client";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { formatUIDate } from "@/lib/utils/date";
import DiaryWrapper from "@/components/ui/diary-wrapper";
import CollapsibleSection from "@/components/ui/collapsible-section";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { EntitySidebar } from "@/components/ui/entity-sidebar";

import { EntityErrorBoundary } from "@/components/ui/error-boundary";
import { EntityDetailSkeleton } from "@/components/ui/loading-skeleton";
import { getQuestById } from "@/lib/actions/entities";

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
    id: number | null;
    title: string | null;
    gameEditionName: string | null;
    gameEditionVersion: string | null;
  };
  wikiEntities: WikiEntity[];
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

  const questData = await getQuestById(questId);

  if (!questData || questData.adventureId !== adventureId || questData.adventure?.campaignId !== campaignId) {
    notFound();
  }

  const images = parseImagesJson(questData.images);

  return (
    <EntityErrorBoundary entityType="quest">
      <PageContainer>
        <PageHeader
          breadcrumb={{
            campaignId: campaignId,
            campaignTitle: questData.campaign.title || "Campaign",
            sectionItems: [
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
            ],
          }}
          title={questData.title}
          actions={
            <Link href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/${questId}/edit`}>
              <Button variant="secondary" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          }
        />

        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<EntityDetailSkeleton />}>
              <QuestDetail questData={questData} images={images} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntitySidebar
              metadata={{
                createdAt: questData.createdAt,
                updatedAt: questData.updatedAt,
                campaign: questData.campaign ? {
                  id: questData.campaign.id || 0,
                  title: questData.campaign.title || "",
                } : null,
              }}
            />
          </div>
        </div>
        </div>
      </PageContainer>
    </EntityErrorBoundary>
  );
}

function QuestDetail({ questData, images }: { questData: QuestData; images: ImageInfo[] }) {
  return (
    <div className="space-y-6">
      {/* Quest Details */}
      <CollapsibleSection title="Quest Details" defaultExpanded={true}>
        <div className="space-y-4">
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
        </div>
      </CollapsibleSection>

      {/* Images */}
      {images.length > 0 && (
        <CollapsibleSection title="Images" defaultExpanded={false}>
          <EntityImageCarousel
            images={images}
            entityType="quests"
          />
        </CollapsibleSection>
      )}

      {/* Wiki Items */}
      {questData.wikiEntities.length > 0 && (
        <CollapsibleSection title="Wiki References" defaultExpanded={false}>
          <WikiEntitiesDisplay
            wikiEntities={questData.wikiEntities}
            entityType="quest"
            entityId={questData.id}
            showImportMessage={false}
            isEditable={false}
          />
        </CollapsibleSection>
      )}

      {/* Diary */}
      <DiaryWrapper
        entityType="quest"
        entityId={questData.id}
        campaignId={parseInt(questData.campaign.id?.toString() || "0")}
        title="Quest Diary"
      />
    </div>
  );
}