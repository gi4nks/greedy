import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { campaigns, adventures, sessions, quests, gameEditions } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  BookOpen, 
  Calendar, 
  Clock,
  Scroll,
  Play,
  Edit,
  Settings,
  Plus
} from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { ImageCarousel } from '@/components/ui/image-carousel';
import { parseImagesJson } from '@/lib/utils/imageUtils.client';
import { formatDuration, formatDate } from '@/lib/utils/date';

interface AdventurePageProps {
  params: Promise<{ id: string; adventureId: string }>;
}

async function getAdventureWithStats(campaignId: number, adventureId: number) {
  // Get adventure details
  const [adventure] = await db
    .select({
      id: adventures.id,
      campaignId: adventures.campaignId,
      title: adventures.title,
      description: adventures.description,
      status: adventures.status,
      startDate: adventures.startDate,
      endDate: adventures.endDate,
      slug: adventures.slug,
      images: adventures.images,
      createdAt: adventures.createdAt,
      updatedAt: adventures.updatedAt,
    })
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  if (!adventure || adventure.campaignId !== campaignId) return null;

  // Get stats
  const [sessionCount] = await db
    .select({ count: count() })
    .from(sessions)
    .where(eq(sessions.adventureId, adventureId));

  const [questCount] = await db
    .select({ count: count() })
    .from(quests)
    .where(eq(quests.adventureId, adventureId));

  // Get campaign info for breadcrumb
  const [campaign] = await db
    .select({ title: campaigns.title })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return {
    ...adventure,
    stats: {
      sessions: sessionCount?.count || 0,
      quests: questCount?.count || 0,
    },
    campaign: campaign?.title || 'Unknown Campaign'
  };
}

export default async function AdventurePage({ params }: AdventurePageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);
  
  const adventure = await getAdventureWithStats(campaignId, adventureId);

  if (!adventure) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={adventure.campaign}
        sectionItems={[
          { label: 'Adventures', href: `/campaigns/${campaignId}/adventures` },
          { label: adventure.title }
        ]}
      />

      {/* Adventure Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{adventure.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={adventure.status === 'active' ? 'default' : 'secondary'}>
                {adventure.status || 'active'}
              </Badge>
              {adventure.startDate && (
                <div className="flex items-center gap-1 text-sm text-base-content/70">
                  <Calendar className="w-4 h-4" />
                  Started {formatDate(adventure.startDate)}
                </div>
              )}
              {adventure.slug && (
                <Badge variant="success" className="font-mono">
                  {adventure.slug}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/campaigns/${campaignId}/adventures/${adventureId}/edit`}>
              <Button variant="primary" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {adventure.description && (
          <p className="text-base-content/70 max-w-3xl">{adventure.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <Play className="w-4 h-4 text-base-content/70" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adventure.stats.sessions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Quests</CardTitle>
              <Scroll className="w-4 h-4 text-base-content/70" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adventure.stats.quests}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Clock className="w-4 h-4 text-base-content/70" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium capitalize">{adventure.status || 'Active'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Calendar className="w-4 h-4 text-base-content/70" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(adventure.startDate, adventure.endDate)}
            </div>
            {adventure.startDate && (
              <div className="text-sm text-base-content/70 mt-1">
                {adventure.startDate && formatDate(adventure.startDate)}
                {adventure.endDate && ` - ${formatDate(adventure.endDate)}`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-500" />
                Sessions
              </CardTitle>
              <div className="flex gap-2">
                <Link href={`/campaigns/${campaignId}/sessions/create?adventureId=${adventureId}`}>
                  <Button size="sm" variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Session
                  </Button>
                </Link>
                <Link href={`/campaigns/${campaignId}/sessions?adventure=${adventureId}`}>
                  <Button size="sm" variant="secondary">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-base-content/70 mb-3">
              Track game sessions for this adventure.
            </p>
            <div className="text-2xl font-bold text-blue-600">
              {adventure.stats.sessions} sessions
            </div>
          </CardContent>
        </Card>

        {/* Quests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-orange-500" />
                Quests
              </CardTitle>
              <div className="flex gap-2">
                <Link href={`/campaigns/${campaignId}/adventures/${adventureId}/quests/create`}>
                  <Button size="sm" variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Quest
                  </Button>
                </Link>
                <Link href={`/campaigns/${campaignId}/adventures/${adventureId}/quests`}>
                  <Button size="sm" variant="secondary">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-base-content/70 mb-3">
              Manage quests and objectives for this adventure.
            </p>
            <div className="text-2xl font-bold text-orange-600">
              {adventure.stats.quests} quests
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Carousel */}
      <div className="mb-8">
        <ImageCarousel
          images={parseImagesJson(adventure.images)}
          className="max-w-4xl mx-auto"
        />
      </div>


    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AdventurePageProps) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = parseInt(resolvedParams.adventureId);
  const adventure = await getAdventureWithStats(campaignId, adventureId);

  return {
    title: adventure ? `${adventure.title} | Adventure Details` : 'Adventure Not Found',
    description: adventure?.description || 'Adventure details and management',
  };
}