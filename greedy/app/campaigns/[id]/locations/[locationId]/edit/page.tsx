import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { locations, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LocationForm from "@/components/location/LocationForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface EditLocationPageProps {
  params: Promise<{ id: string; locationId: string }>;
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

  return location;
}

export default async function EditLocationPage({
  params,
}: EditLocationPageProps) {
  const resolvedParams = await params;
  const locationId = parseInt(resolvedParams.locationId);
  const campaignId = parseInt(resolvedParams.id);

  const location = await getLocation(locationId);

  if (!location || location.campaignId !== campaignId) {
    notFound();
  }

  return (
    <Suspense fallback={<EditLocationSkeleton />}>
      <DynamicBreadcrumb
        campaignId={campaignId}
        sectionItems={[
          { label: "Locations", href: `/campaigns/${campaignId}/locations` },
          {
            label: location.name,
            href: `/campaigns/${campaignId}/locations/${locationId}`,
          },
          { label: "Edit" },
        ]}
      />
      <LocationForm
        campaignId={campaignId}
        adventureId={location.adventureId || undefined}
        mode="edit"
        location={{
          ...location,
          description: location.description || undefined,
        }}
      />
    </Suspense>
  );
}

function EditLocationSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="space-y-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditLocationPageProps) {
  const resolvedParams = await params;
  const location = await getLocation(parseInt(resolvedParams.locationId));

  return {
    title: location ? `Edit ${location.name}` : "Edit Location",
    description:
      location?.description || `Edit ${location?.name} location details`,
  };
}
