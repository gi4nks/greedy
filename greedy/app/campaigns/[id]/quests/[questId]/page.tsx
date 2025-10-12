import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { campaigns, quests, adventures, gameEditions, wikiArticleEntities, wikiArticles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Flag, Star, Edit, ArrowLeft } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import WikiEntitiesDisplay from '@/components/ui/wiki-entities-display';
import { WikiEntity } from '@/lib/types/wiki';
import { EntityImageCarousel } from '@/components/ui/image-carousel';
import { parseImagesJson } from '@/lib/utils/imageUtils.client';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { formatDate } from '@/lib/utils/date';

interface QuestPageProps {
  params: Promise<{ id: string; questId: string }>;
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

async function getQuest(questId: number) {
  const [quest] = await db
    .select({
      quest: quests,
      adventure: adventures,
    })
    .from(quests)
    .leftJoin(adventures, eq(quests.adventureId, adventures.id))
    .where(eq(quests.id, questId))
    .limit(1);

  if (!quest) return null;

  // Get wiki entities for this quest
  const wikiEntitiesData = await db
    .select({
      id: wikiArticles.id,
      title: wikiArticles.title,
      contentType: wikiArticles.contentType,
      rawContent: wikiArticles.rawContent,
      parsedData: wikiArticles.parsedData,
      wikiUrl: wikiArticles.wikiUrl,
      relationshipType: wikiArticleEntities.relationshipType,
      relationshipData: wikiArticleEntities.relationshipData,
    })
    .from(wikiArticleEntities)
    .innerJoin(wikiArticles, eq(wikiArticleEntities.wikiArticleId, wikiArticles.id))
    .where(
      and(
        eq(wikiArticleEntities.entityType, 'quest'),
        eq(wikiArticleEntities.entityId, questId)
      )
    );

  // Map rawContent to description for frontend compatibility
  const wikiEntities: WikiEntity[] = wikiEntitiesData.map(entity => ({
    id: entity.id,
    title: entity.title,
    contentType: entity.contentType,
    description: entity.rawContent || '', // Map rawContent to description
    parsedData: entity.parsedData,
    wikiUrl: entity.wikiUrl || undefined,
    relationshipType: entity.relationshipType || undefined,
    relationshipData: entity.relationshipData,
  }));

  return {
    ...quest,
    wikiEntities,
  };
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'active':
      return <Clock className="w-5 h-5 text-blue-500" />;
    case 'failed':
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-base-content/50" />;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return <Flag className="w-5 h-5 text-red-500" />;
    case 'medium':
      return <Flag className="w-5 h-5 text-yellow-500" />;
    case 'low':
      return <Flag className="w-5 h-5 text-green-500" />;
    default:
      return <Flag className="w-5 h-5 text-base-content/50" />;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'main':
      return <Star className="w-5 h-5 text-yellow-500" />;
    case 'side':
      return <Clock className="w-5 h-5 text-blue-500" />;
    default:
      return <Clock className="w-5 h-5 text-base-content/50" />;
  }
}

export default async function QuestPage({ params }: QuestPageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const questId = parseInt(resolvedParams.questId);

  const campaign = await getCampaign(campaignId);
  const questData = await getQuest(questId);

  if (!campaign || !questData) {
    notFound();
  }

  const { quest, adventure, wikiEntities } = questData;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <DynamicBreadcrumb
          items={[
            { label: 'Campaigns', href: '/campaigns' },
            { label: campaign.title, href: `/campaigns/${campaignId}` },
            { label: 'Quests', href: `/campaigns/${campaignId}/quests` },
            { label: quest.title, href: `/campaigns/${campaignId}/quests/${questId}` },
          ]}
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(quest.status || 'active')}
            <div>
              <h1 className="text-3xl font-bold">{quest.title}</h1>
              <p className="text-base-content/70">
                {campaign.title} • {quest.type || 'main'} quest
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/campaigns/${campaignId}/quests/${questId}/edit`}>
              <Button variant="secondary" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
            <Link href={`/campaigns/${campaignId}/quests`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Quests
              </Button>
            </Link>
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
              <div className="flex flex-wrap gap-2">
                <Badge variant={quest.status === 'completed' ? 'default' : 'secondary'}>
                  {quest.status || 'active'}
                </Badge>
                <Badge variant="outline">
                  {quest.priority || 'medium'} priority
                </Badge>
                <Badge variant="outline">
                  {quest.type || 'main'} quest
                </Badge>
              </div>

              {quest.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Description</h3>
                  <MarkdownRenderer content={quest.description} className="prose-sm" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wiki Entities */}
          {wikiEntities && wikiEntities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Wiki Items</CardTitle>
              </CardHeader>
              <CardContent>
                <WikiEntitiesDisplay
                  wikiEntities={wikiEntities}
                  entityType="quest"
                  entityId={quest.id}
                  showImportMessage={false}
                  isEditable={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Images */}
          <EntityImageCarousel
            images={parseImagesJson(quest.images)}
            entityType="quests"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quest Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(quest.status || 'active')}
                  <span className="text-sm capitalize">{quest.status || 'active'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                <div className="flex items-center gap-2">
                  {getPriorityIcon(quest.priority || 'medium')}
                  <span className="text-sm capitalize">{quest.priority || 'medium'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type</span>
                <div className="flex items-center gap-2">
                  {getTypeIcon(quest.type || 'main')}
                  <span className="text-sm capitalize">{quest.type || 'main'}</span>
                </div>
              </div>

              {quest.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Due Date</span>
                  <span className="text-sm">{formatDate(quest.dueDate)}</span>
                </div>
              )}

              {adventure && (
                <div className="pt-2 border-t">
                  <span className="text-sm font-medium">Adventure</span>
                  <div className="mt-1">
                    <Link href={`/campaigns/${campaignId}/adventures/${adventure.id}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-base-200">
                        {adventure.title}
                      </Badge>
                    </Link>
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