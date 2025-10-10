import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { campaigns, sessions, adventures, gameEditions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, Clock, FileText, Users } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { formatDate, formatMonthYear } from '@/lib/utils/date';

interface SessionsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adventure?: string }>;
}

interface SessionData {
  id: number;
  adventureId: number | null;
  title: string;
  date: string;
  text: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  adventure: {
    id: number;
    title: string;
  };
}

async function getAdventure(adventureId: number) {
  const [adventure] = await db
    .select({
      id: adventures.id,
      title: adventures.title,
    })
    .from(adventures)
    .where(eq(adventures.id, adventureId))
    .limit(1);

  return adventure;
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

  return campaign;
}

async function getSessions(campaignId: number, adventureId?: number) {
  // Get sessions through adventures that belong to this campaign
  const whereConditions = adventureId
    ? and(eq(adventures.campaignId, campaignId), eq(sessions.adventureId, adventureId))
    : eq(adventures.campaignId, campaignId);

  const sessionsList = await db
    .select({
      id: sessions.id,
      adventureId: sessions.adventureId,
      title: sessions.title,
      date: sessions.date,
      text: sessions.text,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      adventure: {
        id: adventures.id,
        title: adventures.title,
      }
    })
    .from(sessions)
    .innerJoin(adventures, eq(sessions.adventureId, adventures.id))
    .where(whereConditions)
    .orderBy(sessions.date);

  return sessionsList;
}

export default async function SessionsPage({ params, searchParams }: SessionsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const campaignId = parseInt(resolvedParams.id);
  const adventureId = resolvedSearchParams.adventure ? parseInt(resolvedSearchParams.adventure) : undefined;
  
  const campaign = await getCampaign(campaignId);
  const adventure = adventureId ? await getAdventure(adventureId) : null;

  if (!campaign) {
    notFound();
  }

  const sessions = await getSessions(campaignId, adventureId);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={campaign.title}
        sectionItems={adventure ? [
          { label: 'Adventures', href: `/campaigns/${campaignId}/adventures` },
          { label: adventure.title, href: `/campaigns/${campaignId}/adventures/${adventure.id}` },
          { label: 'Sessions' }
        ] : [
          { label: 'Sessions' }
        ]}
      />
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {adventure ? `Sessions - ${adventure.title}` : 'Sessions'}
            </h1>
            <p className="text-base-content/70">
              {adventure 
                ? `Track game sessions for the "${adventure.title}" adventure.`
                : 'Organize and track your game sessions by month and year.'
              }
            </p>
          </div>
          <Link href={`/campaigns/${campaignId}/sessions/create${adventure ? `?adventureId=${adventure.id}` : ''}`}>
            <Button className="gap-2" variant="primary">
              <Plus className="w-4 h-4" />
              Create Session
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<SessionsListSkeleton />}>
        <SessionsList sessions={sessions} campaignId={campaignId} adventure={adventure} />
      </Suspense>
    </div>
  );
}

function SessionsList({ sessions, campaignId, adventure }: { 
  sessions: SessionData[], 
  campaignId: number,
  adventure?: { id: number; title: string } | null
}) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Calendar className="w-16 h-16 mx-auto text-base-content/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {adventure ? `No sessions found for "${adventure.title}"` : 'No sessions yet'}
          </h3>
          <p className="text-base-content/70 mb-4">
            {adventure 
              ? `Create your first session for the "${adventure.title}" adventure to start logging your campaign progress.`
              : 'Create your first session to start logging your campaign progress.'
            }
          </p>
        </div>
        <Link href={`/campaigns/${campaignId}/sessions/create${adventure ? `?adventureId=${adventure.id}` : ''}`}>
          <Button size="sm" variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            {adventure ? `Create First Session for ${adventure.title}` : 'Create First Session'}
          </Button>
        </Link>
      </div>
    );
  }

  // Group sessions by month for better organization
  const sessionsByMonth: Record<string, { label: string; sessions: any[] }> = sessions.reduce((acc, session) => {
    const date = new Date(session.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthLabel = formatMonthYear(session.date);
    
    if (!acc[monthKey]) {
      acc[monthKey] = { label: monthLabel, sessions: [] };
    }
    acc[monthKey].sessions.push(session);
    return acc;
  }, {} as Record<string, { label: string; sessions: any[] }>);

  return (
    <div className="space-y-8">
              {Object.entries(sessionsByMonth).map(([monthKey, monthData]) => (
        <div key={monthKey}>
          <h2 className="text-lg font-semibold mb-4 text-base-content/70">{monthData.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthData.sessions.map((session) => {
              const sessionDate = new Date(session.date);
              const hasContent = session.text && session.text.trim().length > 0;
              
              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="info" className="text-xs">
                              {formatDate(session.date)}
                            </Badge>
                            {session.adventure && (
                              <span className="text-xs text-base-content/70">
                                {session.adventure.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {session.text && (
                      <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
                        {session.text}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-base-content/70 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.date)}
                      </div>
                      {hasContent && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Has Notes
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Link href={`/sessions/${session.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${campaignId}/sessions/${session.id}/edit`}>
                        <Button variant="primary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionsListSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-12 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params, searchParams }: SessionsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const campaign = await getCampaign(parseInt(resolvedParams.id));
  const adventureId = resolvedSearchParams.adventure ? parseInt(resolvedSearchParams.adventure) : undefined;
  const adventure = adventureId ? await getAdventure(adventureId) : null;

  const title = adventure 
    ? `${campaign?.title || 'Campaign'} - ${adventure.title} - Sessions | Adventure Diary`
    : campaign 
      ? `${campaign.title} - Sessions | Adventure Diary` 
      : 'Sessions Not Found';

  return {
    title,
    description: adventure 
      ? `Track session logs and campaign progress for the "${adventure.title}" adventure`
      : 'Track session logs and campaign progress',
  };
}