import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Edit } from "lucide-react";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { formatDate } from "@/lib/utils/date";
import CollapsibleSection from "@/components/ui/collapsible-section";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { EntitySidebar } from "@/components/ui/entity-sidebar";
import EntityRelationships from "@/components/ui/entity-relationships";
import { getEntityRelationships } from "@/lib/actions/relationships";

import { EntityErrorBoundary } from "@/components/ui/error-boundary";
import { EntityDetailSkeleton } from "@/components/ui/loading-skeleton";
import { getLocationById } from "@/lib/actions/entities";

interface LocationPageProps {
  params: Promise<{ id: string; locationId: string }>;
}

interface LocationData {
  id: number;
  campaignId: number | null;
  adventureId: number | null;
  name: string;
  description: string | null;
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
  } | null;
  wikiEntities: WikiEntity[];
  magicItems: {
    assignmentId: number;
    magicItemId: number;
    name: string;
    rarity: string | null;
    type: string | null;
    description: string | null;
    source: string | null;
    notes: string | null;
    assignedAt: string | null;
  }[];
  linkedQuests: {
    id: number;
    title: string;
    status: string | null;
    type: string | null;
    relationType: string;
  }[];
}

export default async function LocationPage({ params }: LocationPageProps) {
  const resolvedParams = await params;
  const locationId = parseInt(resolvedParams.locationId);
  const campaignId = parseInt(resolvedParams.id);

  const location = await getLocationById(locationId);

  if (!location || !location.campaignId || location.campaignId !== campaignId) {
    notFound();
  }

  // Fetch relationships for this location
  const relationships = await getEntityRelationships(locationId.toString(), "location");

  return (
    <EntityErrorBoundary entityType="location">
      <PageContainer>
        <PageHeader
          breadcrumb={{
            campaignId: campaignId,
            campaignTitle: location.campaign?.title || undefined,
            sectionItems: [
              { label: "Locations", href: `/campaigns/${campaignId}/locations` },
              { label: location.name },
            ],
          }}
          title={location.name}
          subtitle={location.description || undefined}
          actions={
            <Link href={`/campaigns/${campaignId}/locations/${locationId}/edit`}>
              <Button variant="secondary" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<EntityDetailSkeleton />}>
              <LocationDetail location={location} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntitySidebar
              metadata={{
                createdAt: location.createdAt,
                updatedAt: location.updatedAt,
                campaign: location.campaign ? {
                  id: location.campaign.id,
                  title: location.campaign.title,
                } : null,
              }}
            />

            {/* Assigned Magic Items */}
            {location.magicItems.length > 0 && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-lg">Magic Items</h3>
                  <div className="space-y-3">
                    {location.magicItems.slice(0, 3).map((item) => (
                      <div key={item.assignmentId} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <div className="flex gap-1 mt-1">
                            {item.rarity && (
                              <Badge variant="outline" className="text-xs">
                                {item.rarity}
                              </Badge>
                            )}
                            {item.type && (
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {location.magicItems.length > 3 && (
                      <p className="text-xs text-base-content/60">
                        +{location.magicItems.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Linked Quests */}
            {location.linkedQuests.length > 0 && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-lg">Linked Quests</h3>
                  <div className="space-y-3">
                    {location.linkedQuests.slice(0, 3).map((quest) => (
                      <div key={quest.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{quest.title}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {quest.status || "active"}
                            </Badge>
                            {quest.type && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                {quest.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {location.linkedQuests.length > 3 && (
                      <p className="text-xs text-base-content/60">
                        +{location.linkedQuests.length - 3} more quests
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <EntityRelationships
              entityId={location.id.toString()}
              entityType="location"
              relationships={relationships}
              campaignId={campaignId.toString()}
            />
          </div>
        </div>
      </PageContainer>
    </EntityErrorBoundary>
  );
}

function LocationDetail({ location }: { location: LocationData }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {location.description && (
        <CollapsibleSection title="Description" defaultExpanded={true}>
          <MarkdownRenderer
            content={location.description}
            className="prose-sm"
          />
        </CollapsibleSection>
      )}

      {/* Images */}
      <CollapsibleSection title="Images" defaultExpanded={false}>
        <EntityImageCarousel
          images={parseImagesJson(location.images)}
          entityType="locations"
          className="max-w-2xl mx-auto"
        />
      </CollapsibleSection>

      {/* Magic Items */}
      <CollapsibleSection title="Magic Items" defaultExpanded={false}>
        {location.magicItems.length > 0 ? (
          <div className="space-y-4">
            {location.magicItems.map((item) => (
              <div
                key={item.assignmentId}
                className="rounded-lg border border-base-200 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.rarity && (
                        <Badge variant="outline" className="capitalize">
                          {item.rarity}
                        </Badge>
                      )}
                      {item.type && (
                        <Badge variant="secondary" className="capitalize">
                          {item.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {item.assignedAt && (
                    <span className="text-sm text-base-content/60">
                      Assigned {formatDate(item.assignedAt)}
                    </span>
                  )}
                </div>

                {item.description && (
                  <div className="mt-3 text-sm text-base-content/80 prose prose-sm max-w-none dark:prose-invert">
                    <MarkdownRenderer content={item.description} />
                  </div>
                )}

                {(item.source || item.notes) && (
                  <div className="mt-3 flex flex-col gap-1 text-sm text-base-content/70">
                    {item.source && (
                      <div>
                        <span className="font-medium text-base-content/60">
                          Source:
                        </span>{" "}
                        {item.source}
                      </div>
                    )}
                    {item.notes && (
                      <div>
                        <span className="font-medium text-base-content/60">
                          Notes:
                        </span>{" "}
                        {item.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content/70">
            No magic items assigned to this location.
          </p>
        )}
      </CollapsibleSection>

      {/* Wiki Entities */}
      {location.wikiEntities && location.wikiEntities.length > 0 && (
        <CollapsibleSection title="Wiki Items" defaultExpanded={false}>
          <WikiEntitiesDisplay
            wikiEntities={location.wikiEntities}
            entityType="location"
            entityId={location.id}
            showImportMessage={false}
            isEditable={false}
          />
        </CollapsibleSection>
      )}

      {!location.description &&
        (!location.wikiEntities || location.wikiEntities.length === 0) && (
          <CollapsibleSection title="Getting Started" defaultExpanded={true}>
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-base-content/70 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No description available
              </h3>
              <p className="text-base-content/70 mb-4">
                Add a description to bring this location to life.
              </p>
              <Link
                href={`/campaigns/${location.campaign?.id}/locations/${location.id}/edit`}
              >
                <Button variant="secondary" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </CollapsibleSection>
        )}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: LocationPageProps) {
  const resolvedParams = await params;
  const location = await getLocationById(parseInt(resolvedParams.locationId));

  return {
    title: location
      ? `${location.name} | Adventure Diary`
      : "Location Not Found",
    description:
      location?.description || `Explore ${location?.name} in your D&D campaign`,
  };
}
