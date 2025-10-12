import { getCampaigns } from '@/lib/actions/campaigns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Calendar, BookOpen, Edit, View } from 'lucide-react';
import { formatCardDate } from '@/lib/utils/date';

interface CampaignWithGameEdition {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  tags: unknown;
  gameEditionId: number | null;
  gameEditionName: string | null;
  gameEditionVersion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default async function CampaignsPage() {
  const campaigns: CampaignWithGameEdition[] = await getCampaigns();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'planning': return 'badge-warning';
      case 'completed': return 'badge-info';
      case 'hiatus': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-base-content/70 mt-2">
            Manage and track your D&D adventures
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="gap-2" variant="primary">
            <BookOpen className="w-4 h-4" />
            Create
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-base-content/60 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
            <p className="text-base-content/70 mb-6">
              Create your first campaign to start tracking your D&D adventures, characters, and sessions.
            </p>
            <Link href="/campaigns/new">
              <Button variant="primary">
                <BookOpen className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold line-clamp-1">
                    {campaign.title}
                  </CardTitle>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {campaign.description && (
                    <p className="text-base-content/70 line-clamp-3">
                      {campaign.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-base-content/70">
                    {campaign.gameEditionName && (
                      <span className="flex items-center gap-1">
                        🎲 {campaign.gameEditionName}{campaign.gameEditionVersion && !campaign.gameEditionName.includes(campaign.gameEditionVersion) ? ` ${campaign.gameEditionVersion}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatCardDate(campaign.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 mt-auto">
                  <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                    <Button variant="warning" className="gap-2 w-full">
                      <View className="w-4 h-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/campaigns/${campaign.id}/edit`}>
                    <Button variant="secondary" className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/campaigns/${campaign.id}/adventures`}>
                    <Button variant="neutral" size="sm">
                      Adventures
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
