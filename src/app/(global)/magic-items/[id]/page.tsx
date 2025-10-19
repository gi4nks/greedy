import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MagicItemAssignmentComposer } from "@/components/magic-items/MagicItemAssignmentComposer";
import { UnassignMagicItemButton } from "@/components/magic-items/UnassignMagicItemButton";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { EntityImageCarousel } from "@/components/ui/image-carousel";
import { getMagicItemById, deleteMagicItem } from "@/lib/actions/magicItems";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { parseImagesJson, type ImageInfo } from "@/lib/utils/imageUtils.client";
import type { MagicItemAssignableEntity } from "@/lib/magicItems/shared";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { DeleteMagicItemForm } from "@/components/magic-items/DeleteMagicItemForm";

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

function buildExistingAssignments(assignments: ParsedAssignment[]) {
  return assignments.map((assignment) => ({
    entityType: assignment.entityType,
    entityId: assignment.entityId,
  }));
}

function parseImages(images: unknown): ImageInfo[] {
  try {
    return parseImagesJson(images);
  } catch (error) {
    console.warn("Failed to parse magic item images", error);
    return [];
  }
}

function metadataBadges(item: {
  rarity: string | null;
  type: string | null;
  attunementRequired: boolean | null;
  source: "manual" | "wiki";
}) {
  const badges: {
    id: string;
    content: string;
    variant: "default" | "secondary" | "outline";
    className?: string;
  }[] = [];

  if (item.rarity) {
    badges.push({ id: "rarity", content: item.rarity, variant: "outline" });
  }

  if (item.type) {
    badges.push({ id: "type", content: item.type, variant: "secondary" });
  }

  badges.push({
    id: "source",
    content: item.source,
    variant: item.source === "wiki" ? "default" : "outline",
    className: item.source === "wiki" ? "bg-blue-500 text-white" : "",
  });

  if (item.attunementRequired) {
    badges.push({
      id: "attunement",
      content: "Attunement required",
      variant: "secondary",
      className: "bg-emerald-500 text-white",
    });
  }

  return badges;
}

export default async function MagicItemDetailPage({
  params,
}: MagicItemDetailPageProps) {
  const resolvedParams = await params;
  const itemId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(itemId)) {
    notFound();
  }

  const [item, campaignOptions] = await Promise.all([
    getMagicItemById(itemId),
    getCampaignOptions(),
  ]);

  if (!item) {
    notFound();
  }

  const parsedAssignments = parseAssignments(item.assignments);
  const assignmentsByType = groupAssignmentsByType(parsedAssignments);
  const existingAssignments = buildExistingAssignments(parsedAssignments);
  const properties = parseProperties(item.properties);
  const images = parseImages(item.images);

  return (
    <>
      <DynamicBreadcrumb
        items={[
          { label: "Magic Items", href: "/magic-items" },
          { label: item.name },
        ]}
      />

      {/* Magic Item Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-wrap gap-2 text-sm text-base-content/70">
                {metadataBadges(item).map((badge) => (
                  <Badge
                    key={badge.id}
                    variant={badge.variant}
                    className={`capitalize ${badge.className ?? ""}`}
                  >
                    {badge.content}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <MagicItemAssignmentComposer
              itemId={item.id}
              existingAssignments={existingAssignments}
              campaignOptions={campaignOptions}
            />
            {item.source === "manual" && (
              <>
                <Link href={`/magic-items/${item.id}/edit`}>
                  <Button
                    variant="secondary"
                    className="w-full gap-2 sm:w-auto"
                    size="sm"
                  >
                    Edit
                  </Button>
                </Link>
                <DeleteMagicItemForm itemId={item.id} itemName={item.name} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="mb-8">
          <EntityImageCarousel images={images} entityType="magic-item" className="max-w-2xl mx-auto" />
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <Card className="border-base-200">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base-content/70">
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
          </CardContent>
        </Card>
      </div>

      {/* Assignments */}
      <Card className="border-base-200">
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {parsedAssignments.length === 0 ? (
            <div className="rounded-md border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60">
              This magic item has not been assigned to any entities yet.
            </div>
          ) : (
            Object.entries(assignmentsByType).map(
              ([entityType, assignments]) => (
                <div key={entityType} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {entityType}
                    </Badge>
                    <span className="text-xs text-base-content/60">
                      {assignments.length} assignment
                      {assignments.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-md border border-base-200 bg-base-100 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            {assignment.entityType === "character" && assignment.entityPath ? (
                              <Link
                                href={assignment.entityPath}
                                className="text-lg font-semibold text-primary hover:text-primary/80"
                              >
                                {assignment.entityName}
                              </Link>
                            ) : (
                              <span className="text-lg font-semibold text-base-content">
                                {assignment.entityName}
                              </span>
                            )}
                            <Badge variant="outline" className="capitalize text-xs w-fit mt-1">
                              {assignment.entityType}
                            </Badge>
                          </div>
                        </div>
                        <UnassignMagicItemButton
                          itemId={item.id}
                          entityType={assignment.entityType}
                          entityId={assignment.entityId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </CardContent>
      </Card>
    </>
  );
}
