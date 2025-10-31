import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { getMagicItemById } from "@/lib/actions/magicItems";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { parseImagesJson, type ImageInfo } from "@/lib/utils/imageUtils.client";
import type { MagicItemAssignableEntity } from "@/lib/magicItems/shared";
import type { MagicItemWithAssignments } from "@/lib/actions/magicItems";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import CollapsibleSection from "@/components/ui/collapsible-section";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { MagicItemSidebar } from "@/components/magic-items/MagicItemSidebar";
import { MagicItemWikiLinks } from "@/components/magic-items/MagicItemWikiLinks";
import { UnassignMagicItemButton } from "@/components/magic-items/UnassignMagicItemButton";

import { EntityErrorBoundary } from "@/components/ui/error-boundary";
import { EntityDetailSkeleton } from "@/components/ui/loading-skeleton";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

function parseProperties(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    if (value.trim() === "") {
      return null;
    }

    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch (error) {
      console.warn("Failed to parse magic item properties", error);
      return null;
    }
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
}

interface MagicItemDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  if (typeof value === "string") {
    return value.trim() === "" ? "Unknown" : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    console.warn("Failed to stringify magic item property value", error);
    return "Unknown";
  }
}

async function getCampaignOptions() {
  const rows = await db
    .select({ id: campaigns.id, title: campaigns.title })
    .from(campaigns)
    .orderBy(campaigns.title);

  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? `Campaign ${row.id}`,
  }));
}

function parseAssignments(
  assignments: {
    id: number;
    entityType: MagicItemAssignableEntity;
    entityId: number;
    entityName: string;
    entityDescription?: string | null;
    entityPath: string | null;
    campaignTitle: string | null;
    source: string | null;
    notes: string | null;
    assignedAt: string | null;
  }[],
) {
  return [...assignments]
    .sort((a, b) => {
      const aTime = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const bTime = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
      return bTime - aTime;
    })
    .map((assignment) => ({
      ...assignment,
    }));
}

type ParsedAssignment = ReturnType<typeof parseAssignments>[number];

function groupAssignmentsByType(assignments: ParsedAssignment[]) {
  return assignments.reduce<Record<string, ParsedAssignment[]>>(
    (acc, assignment) => {
      const key = assignment.entityType;
      acc[key] = acc[key] ?? [];
      acc[key].push(assignment);
      return acc;
    },
    {},
  );
}

function parseImages(images: unknown): ImageInfo[] {
  try {
    return parseImagesJson(images);
  } catch (error) {
    console.warn("Failed to parse magic item images", error);
    return [];
  }
}

function MagicItemDetail({
  item,
  properties,
  images,
}: {
  item: MagicItemWithAssignments;
  properties: Record<string, unknown> | null;
  images: ImageInfo[];
}) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <CollapsibleSection title="Description" defaultExpanded={true}>
        <div className="space-y-4 text-base-content/70">
          {item.description ? (
            <MarkdownRenderer
              content={item.description}
              className="prose-base"
            />
          ) : (
            <p className="italic text-base-content/60">
              No description available for this magic item.
            </p>
          )}

          {properties && Object.keys(properties).length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Properties
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(properties).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-md border border-base-200 bg-base-100 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                      {key}
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-base-content">
                      {formatPropertyValue(value)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Images */}
      <CollapsibleSection title="Images" defaultExpanded={false}>
        <EntityImageCarousel
          images={images}
          entityType="magic-item"
          className="max-w-2xl mx-auto"
        />
      </CollapsibleSection>
    </div>
  );
}

function MagicItemAssignments({
  itemId,
  assignmentsByType,
  parsedAssignments,
}: {
  itemId: number;
  assignmentsByType: Record<string, ParsedAssignment[]>;
  parsedAssignments: ParsedAssignment[];
}) {
  return (
    <CollapsibleSection title="Assignments" defaultExpanded={false} className="w-full">
      <div className="space-y-4">
        {parsedAssignments.length === 0 ? (
          <div className="rounded-md border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
            This magic item has not been assigned to any entities yet.
          </div>
        ) : (
          Object.entries(assignmentsByType).map(
            ([entityType, assignments]) => (
              <div key={entityType} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {entityType}
                  </Badge>
                  <span className="text-xs text-base-content/60">
                    {assignments.length} assignment
                    {assignments.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="w-full rounded-md border border-base-200 bg-base-100 p-3 space-y-2"
                    >
                      <div className="flex flex-col gap-1">
                        {assignment.entityType === "character" &&
                        assignment.entityPath ? (
                          <Link
                            href={assignment.entityPath}
                            className="text-base font-semibold text-primary hover:text-primary/80"
                          >
                            {assignment.entityName}
                          </Link>
                        ) : (
                          <span className="text-base font-semibold text-base-content">
                            {assignment.entityName}
                          </span>
                        )}
                        <Badge variant="outline" className="capitalize text-[10px] w-fit">
                          {assignment.entityType}
                        </Badge>
                      </div>
                      <div className="flex justify-end">
                        <UnassignMagicItemButton
                          itemId={itemId}
                          entityType={assignment.entityType}
                          entityId={assignment.entityId}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </CollapsibleSection>
  );
}

export default async function MagicItemPage({ params }: MagicItemDetailPageProps) {
  const { id } = await params;
  const itemId = parseInt(id);

  const item = await getMagicItemById(itemId);

  if (!item) {
    notFound();
  }

  const properties = parseProperties(item.properties);
  const assignments = parseAssignments(item.assignments || []);
  const assignmentsByType = groupAssignmentsByType(assignments);
  const images = parseImages(item.images);
  const campaignOptions = await getCampaignOptions();

  return (
    <EntityErrorBoundary entityType="magic-item">
      <PageContainer>
        <PageHeader
          breadcrumb={{
            items: [
              { label: "Magic Items", href: "/magic-items" },
              { label: item.name },
            ],
          }}
          title={item.name}
          actions={
            <Link href={`/magic-items/${itemId}/edit`}>
              <Button variant="secondary" className="gap-2" size="sm">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          }
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<EntityDetailSkeleton />}>
              <MagicItemDetail
                item={item}
                properties={properties}
                images={images}
              />
            </Suspense>


            {/* Wiki Links */}
            <MagicItemWikiLinks item={item} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <MagicItemSidebar
              item={item}
              campaignOptions={campaignOptions}
              additionalContent={
                <MagicItemAssignments
                  itemId={item.id}
                  assignmentsByType={assignmentsByType}
                  parsedAssignments={assignments}
                />
              }
            />
          </div>
        </div>
      </PageContainer>
    </EntityErrorBoundary>
  );
}
