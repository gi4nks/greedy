import { db } from '@/lib/db';
import { adventures, campaigns } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, MapPin, BookOpen } from 'lucide-react';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getAdventures() {
  const allAdventures = await db
    .select({
      id: adventures.id,
      title: adventures.title,
      description: adventures.description,
      status: adventures.status,
      startDate: adventures.startDate,
      endDate: adventures.endDate,
      createdAt: adventures.createdAt,
      campaignId: adventures.campaignId,
      campaign: {
        id: campaigns.id,
        title: campaigns.title,
      }
    })
    .from(adventures)
    .leftJoin(campaigns, eq(adventures.campaignId, campaigns.id))
    .orderBy(desc(adventures.createdAt));

  return allAdventures;
}

export default async function AdventuresPage() {
  const adventuresList = await getAdventures();

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: 'Adventures' }
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Adventures</h1>
          <p className="text-base-content/70 mt-2">
            Explore all adventures across your campaigns
          </p>
        </div>
      </div>

      {adventuresList.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="w-16 h-16 mx-auto text-base-content/60 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No adventures yet</h3>
            <p className="text-base-content/70 mb-6">
              Adventures are created within campaigns. Start by creating a campaign first.
            </p>
            <Link href="/campaigns">
              <Button size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                View Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adventuresList.map((adventure) => (
            <Card key={adventure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{adventure.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                      <BookOpen className="w-3 h-3" />
                      {adventure.campaign?.title}
                    </div>
                    <Badge variant={adventure.status === 'active' ? 'default' : 'secondary'}>
                      {adventure.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-base-content/70 line-clamp-3">
                  {adventure.description || 'No description provided'}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-base-content/70">
                  {adventure.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(adventure.startDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Link 
                    href={`/campaigns/${adventure.campaignId}/adventures/${adventure.id}`} 
                    className="flex-1"
                  >
                    <Button variant="info" size="sm" className="w-full">
                      View Adventure
                    </Button>
                  </Link>
                  <Link href={`/campaigns/${adventure.campaignId}/timeline`}>
                    <Button variant="neutral" size="sm">
                      Timeline
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}