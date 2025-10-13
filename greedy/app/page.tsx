import Link from "next/link";
import { getCampaigns } from "../lib/actions/campaigns";
import type { Campaign } from "../lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import DynamicBreadcrumb from "../components/ui/dynamic-breadcrumb";
import { BookOpen, Plus, View } from "lucide-react";

// Force dynamic rendering to avoid database queries during build
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const campaigns = await getCampaigns();

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb items={[{ label: "Home" }]} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Greedy</h1>
          <p className="text-base-content/70 mt-2">
            Your gateway to D&D campaign management
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="gap-2" variant="primary">
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign: Campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl">{campaign.title}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <p className="text-base-content/70 line-clamp-3">
                  {campaign.description || "No description"}
                </p>
              </div>

              <div className="flex gap-2 pt-4 mt-auto">
                <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                  <Button variant="warning" className="gap-2 w-full">
                    <View className="w-4 h-4" />
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-base-content/60 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-base-content/70 mb-6">
              Create your first D&D campaign to get started with timeline tracking
              and session management.
            </p>
            <Link href="/campaigns/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
