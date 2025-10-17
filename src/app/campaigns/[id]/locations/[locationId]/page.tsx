import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  campaigns,
  locations,
  adventures,
  gameEditions,
  wikiArticleEntities,
  wikiArticles,
  magicItems,
  magicItemAssignments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Edit, Building, Mountain, Trees } from "lucide-react";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import WikiEntitiesDisplay from "@/components/ui/wiki-entities-display";
import { WikiEntity } from "@/lib/types/wiki";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { parseImagesJson } from "@/lib/utils/imageUtils.client";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { formatDate } from "@/lib/utils/date";

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
}

async function getLocation(locationId: number) {
  const [location] = await db
    .select({
      id: locations.id,
      campaignId: locations.campaignId,
      adventureId: locations.adventureId,
      name: locations.name,
      description: locations.description,
      tags: locations.tags,
      images: locations.images,
      createdAt: locations.createdAt,
      updatedAt: locations.updatedAt,
      adventure: {
        id: adventures.id,
        title: adventures.title,
        campaignId: adventures.campaignId,
      },
    })
    .from(locations)
    .leftJoin(adventures, eq(locations.adventureId, adventures.id))
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!location) return null;

  // Get campaign info directly from location's campaignId
  const campaign = location.campaignId
    ? await db
        .select({
          id: campaigns.id,
          title: campaigns.title,
          gameEditionName: gameEditions.name,
          gameEditionVersion: gameEditions.version,
        })
        .from(campaigns)
        .leftJoin(gameEditions, eq(campaigns.gameEditionId, gameEditions.id))
        .where(eq(campaigns.id, location.campaignId))
        .limit(1)
        .then((result) => result[0] || null)
    : null;

  // Get wiki entities for this location
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
    .innerJoin(
      wikiArticles,
      eq(wikiArticleEntities.wikiArticleId, wikiArticles.id),
    )
    .where(
      and(
        eq(wikiArticleEntities.entityType, "location"),
        eq(wikiArticleEntities.entityId, locationId),
      ),
    );

  // Map rawContent to description for frontend compatibility
  const wikiEntities: WikiEntity[] = wikiEntitiesData.map((entity) => ({
    id: entity.id,
    title: entity.title,
    contentType: entity.contentType,
    description: entity.rawContent || "", // Map rawContent to description
    parsedData: entity.parsedData,
    wikiUrl: entity.wikiUrl || undefined,
    relationshipType: entity.relationshipType || undefined,
    relationshipData: entity.relationshipData,
  }));

  const magicItemsForLocation = await db
    .select({
      assignmentId: magicItemAssignments.id,
      magicItemId: magicItems.id,
      name: magicItems.name,
      rarity: magicItems.rarity,
      type: magicItems.type,
      description: magicItems.description,
      source: magicItemAssignments.source,
      notes: magicItemAssignments.notes,
      assignedAt: magicItemAssignments.assignedAt,
    })
    .from(magicItemAssignments)
    .innerJoin(magicItems, eq(magicItemAssignments.magicItemId, magicItems.id))
    .where(
      and(
        eq(magicItemAssignments.entityType, "location"),
        eq(magicItemAssignments.entityId, locationId),
      ),
    );

  return {
    ...location,
    campaign,
    wikiEntities,
    magicItems: magicItemsForLocation,
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const resolvedParams = await params;
  const locationId = parseInt(resolvedParams.locationId);
  const campaignId = parseInt(resolvedParams.id);

  const location = await getLocation(locationId);

  if (!location || !location.campaignId || location.campaignId !== campaignId) {
    notFound();
  }

  // Parse tags
  let tags: string[] = [];
  try {
    tags =
      typeof location.tags === "string"
        ? JSON.parse(location.tags)
        : location.tags || [];
  } catch {
    tags = [];
  }

  // Determine location icon based on tags or name
  const getLocationIcon = () => {
    const name = location.name?.toLowerCase() || "";
    const locationTags = tags.map((t) => t.toLowerCase());

    if (
      locationTags.includes("city") ||
      locationTags.includes("town") ||
      name.includes("city") ||
      name.includes("town")
    ) {
      return Building;
    }
    if (
      locationTags.includes("mountain") ||
      locationTags.includes("peak") ||
      name.includes("mountain") ||
      name.includes("peak")
    ) {
      return Mountain;
    }
    if (
      locationTags.includes("forest") ||
      locationTags.includes("woods") ||
      name.includes("forest") ||
      name.includes("woods")
    ) {
      return Trees;
    }
    return MapPin;
  };

  const LocationIcon = getLocationIcon();

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        campaignId={campaignId}
        campaignTitle={location.campaign?.title}
        sectionItems={[
          { label: "Locations", href: `/campaigns/${campaignId}/locations` },
          { label: location.name },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <LocationIcon className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{location.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base-content/70">
                  {location.campaign?.title}
                </span>
                {location.adventure && (
                  <>
                    <span className="text-base-content/70">•</span>
                    <span className="text-base-content/70">
                      {location.adventure.title}
                    </span>
                  </>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link href={`/campaigns/${campaignId}/locations/${locationId}/edit`}>
            <Button variant="secondary" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<LocationDetailSkeleton />}>
            <LocationDetail location={location} />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<LocationInfoSkeleton />}>
            <LocationInfo location={location} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function LocationDetail({ location }: { location: LocationData }) {
  return (
    <div className="space-y-6">
      {location.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer
              content={location.description}
              className="prose-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Image Carousel */}
      <EntityImageCarousel
        images={parseImagesJson(location.images)}
        entityType="locations"
        className="max-w-2xl mx-auto"
      />

      <Card>
        <CardHeader>
          <CardTitle>Magic Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {location.magicItems.length > 0 ? (
            location.magicItems.map((item) => (
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
                  <p className="mt-3 text-sm text-base-content/80 whitespace-pre-wrap">
                    {item.description}
                  </p>
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
            ))
          ) : (
            <p className="text-sm text-base-content/70">
              No magic items assigned to this location.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wiki Entities */}
      {location.wikiEntities && location.wikiEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wiki Items</CardTitle>
          </CardHeader>
          <CardContent>
            <WikiEntitiesDisplay
              wikiEntities={location.wikiEntities}
              entityType="location"
              entityId={location.id}
              showImportMessage={false}
              isEditable={false}
            />
          </CardContent>
        </Card>
      )}

      {!location.description &&
        (!location.wikiEntities || location.wikiEntities.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
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
            </CardContent>
          </Card>
        )}
    </div>
  );
}

function LocationInfo({ location }: { location: LocationData }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Location Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-base-content/70">
              Campaign
            </div>
            <div className="text-sm">
              {location.campaign?.title || "Unknown"}
            </div>
          </div>

          {location.adventure && (
            <div>
              <div className="text-sm font-medium text-base-content/70">
                Adventure
              </div>
              <div className="text-sm">{location.adventure.title}</div>
            </div>
          )}

          {location.createdAt && (
            <div>
              <div className="text-sm font-medium text-base-content/70">
                Created
              </div>
              <div className="text-sm">
                {new Date(location.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {location.updatedAt && location.updatedAt !== location.createdAt && (
            <div>
              <div className="text-sm font-medium text-base-content/70">
                Last Updated
              </div>
              <div className="text-sm">
                {new Date(location.updatedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future: Add related characters, quests, sessions, etc. */}
    </div>
  );
}

function LocationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function LocationInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: LocationPageProps) {
  const resolvedParams = await params;
  const location = await getLocation(parseInt(resolvedParams.locationId));

  return {
    title: location
      ? `${location.name} | Adventure Diary`
      : "Location Not Found",
    description:
      location?.description || `Explore ${location?.name} in your D&D campaign`,
  };
}
