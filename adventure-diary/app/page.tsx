import Link from 'next/link'
import { getCampaigns } from '@/lib/actions/campaigns'
import type { Campaign } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Force dynamic rendering to avoid database queries during build
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const campaigns = await getCampaigns()

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold">Adventure Diary</h1>
        <Link href="/campaigns/new" className="btn btn-primary w-full sm:w-auto">
          New Campaign
        </Link>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign: Campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl">{campaign.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-base-content/70 line-clamp-3">
                {campaign.description || 'No description'}
              </p>
              
              <div className="flex gap-2">
                <Link 
                  href={`/campaigns/${campaign.id}`} 
                  className="flex-1"
                >
                  <Button variant="info" size="sm" className="w-full">
                    View Campaign
                  </Button>
                </Link>
                <Link href={`/campaigns/${campaign.id}/timeline`}>
                  <Button variant="neutral" size="sm">
                    Timeline
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <h2 className="text-2xl font-semibold mb-4">No campaigns yet</h2>
          <p className="text-base-content/70 mb-6 text-sm md:text-base px-4">
            Create your first D&D campaign to get started with timeline tracking and session management.
          </p>
          <Link href="/campaigns/new" className="btn btn-primary btn-lg">
            Create Your First Campaign
          </Link>
        </div>
      )}
    </div>
  )
}