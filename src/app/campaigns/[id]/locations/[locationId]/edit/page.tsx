import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { locations, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LocationForm from "@/components/location/LocationForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

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
      <div className="container mx-auto px-4 py-6 md:p-6 max-w-5xl">
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

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Edit Location</h1>
              <p className="text-base-content/70">Update location information</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <LocationForm
              campaignId={campaignId}
              adventureId={location.adventureId || undefined}
              mode="edit"
              location={{
                ...location,
                description: location.description || undefined,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}

function EditLocationSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-8 w-8 rounded-lg"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-8 w-64 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-20 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-20 w-full mb-4"></div>
            <div className="flex gap-4 justify-end">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
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
