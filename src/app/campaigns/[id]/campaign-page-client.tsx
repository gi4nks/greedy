"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  BookOpen,
  Users,
  MapPin,
  Play,
  Edit,
  Share2,
  Trash2,
  AlertTriangle,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { formatDisplayDate } from "@/lib/utils/date";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { deleteCampaign } from "@/lib/actions/campaigns";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface CampaignData {
  id: number;
  gameEditionId: number | null;
  gameEditionName: string | null;
  gameEditionVersion: string | null;
  title: string;
  description: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface CampaignPageClientProps {
  campaign: CampaignData;
  campaignId: number;
}

export default function CampaignPageClient({ campaign, campaignId }: CampaignPageClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCampaign(campaignId);
      // The deleteCampaign function handles redirection, but let's also redirect here as backup
      router.push("/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Campaign</h3>
            </div>
            <p className="text-base-content/70 mb-6">
              Are you sure you want to delete &quot;{campaign.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="neutral"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageContainer className="min-h-screen flex flex-col">
        {/* Breadcrumb */}
        <DynamicBreadcrumb
          campaignId={campaignId}
          campaignTitle={campaign.title}
        />

        {/* Main Content Area */}
        <div className="flex flex-col">
          {/* Campaign Header */}
          <div className="flex-shrink-0 mb-4">
            <PageHeader
              title={campaign.title}
              actions={
                <div className="flex gap-2">
                  <Link href={`/campaigns/${campaignId}/edit`}>
                    <Button variant="secondary" className="gap-2" size="sm">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="neutral"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              }
            />
            <div className="flex items-center gap-4 mt-2">
              <Badge
                variant={campaign.status === "active" ? "default" : "secondary"}
              >
                {campaign.status || "active"}
              </Badge>
              {campaign.gameEditionName && (
                <Badge variant="outline">
                  {campaign.gameEditionName}
                  {campaign.gameEditionVersion &&
                  !campaign.gameEditionName.includes(
                    campaign.gameEditionVersion,
                  )
                    ? ` ${campaign.gameEditionVersion}`
                    : ""}
                </Badge>
              )}
              {campaign.startDate && (
                <div className="flex items-center gap-1 text-sm text-base-content/70">
                  <Calendar className="w-4 h-4" />
                  Started {formatDisplayDate(campaign.startDate)}
                </div>
              )}
            </div>
          </div>

          {/* Description Area - Takes only needed space */}
          {campaign.description && (
            <div className="text-base-content/70 mb-8">
              <MarkdownRenderer
                content={campaign.description}
                className="prose-base"
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <Link href={`/campaigns/${campaignId}/adventures`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <BookOpen className="w-8 h-8 mx-auto mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Adventures</h3>
                <p className="text-sm text-base-content/70">
                  Manage story arcs and modules
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/campaigns/${campaignId}/sessions`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <Play className="w-8 h-8 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Sessions</h3>
                <p className="text-sm text-base-content/70">
                  Track game sessions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/campaigns/${campaignId}/quests`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Quests</h3>
                <p className="text-sm text-base-content/70">
                  Track objectives and storylines
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/campaigns/${campaignId}/characters`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <Users className="w-8 h-8 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Characters</h3>
                <p className="text-sm text-base-content/70">Players and NPCs</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/campaigns/${campaignId}/locations`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Locations</h3>
                <p className="text-sm text-base-content/70">
                  Campaign world places
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/campaigns/${campaignId}/relations`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <LinkIcon className="w-8 h-8 mx-auto mb-3 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Relations</h3>
                <p className="text-sm text-base-content/70">
                  Entity relationships
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/campaigns/${campaignId}/network`} className="group h-full">
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center flex-1">
                <Share2 className="w-8 h-8 mx-auto mb-3 text-indigo-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">Network</h3>
                <p className="text-sm text-base-content/70">
                  Visualize entity relationships
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </PageContainer>
    </>
  );
}