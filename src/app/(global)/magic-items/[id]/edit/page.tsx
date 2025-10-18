import Link from "next/link";
import { notFound } from "next/navigation";
import { MagicItemForm } from "@/components/magic-items/MagicItemForm";
import { MagicItemAssignmentComposer } from "@/components/magic-items/MagicItemAssignmentComposer";
import { UnassignMagicItemButton } from "@/components/magic-items/UnassignMagicItemButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { getMagicItemById } from "@/lib/actions/magicItems";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import type { MagicItemAssignableEntity } from "@/lib/magicItems/shared";
import { formatDate } from "@/lib/utils/date";
import { logger } from "@/lib/utils/logger";
import { Eye, Sparkles } from "lucide-react";

interface EditMagicItemPageProps {
  params: Promise<{ id: string }>;
}

function serializeProperties(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    logger.warn("Failed to stringify magic item properties", error);
    return "";
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
      assignedDateLabel: assignment.assignedAt
        ? formatDate(assignment.assignedAt)
        : null,
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

function assignmentBadges(assignments: ParsedAssignment[]) {
  if (!assignments.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {assignments.slice(0, 5).map((assignment) => (
        <Badge
          key={`${assignment.entityType}-${assignment.entityId}`}
          variant="secondary"
          className="capitalize"
        >
          {assignment.entityType} • {assignment.entityName ?? "Unnamed"}
        </Badge>
      ))}
    </div>
  );
}

export default async function EditMagicItemPage({
  params,
}: EditMagicItemPageProps) {
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

  // Only allow editing of manual items, not wiki items
  if (item.source === "wiki") {
    return (
      <div className="container mx-auto p-6">
        <DynamicBreadcrumb
          items={[
            { label: "Campaigns", href: "/campaigns" },
            { label: "Magic Items", href: "/magic-items" },
            { label: item.name, href: `/magic-items/${itemId}` },
            { label: "Edit" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Edit Magic Item</h1>
            <p className="text-base-content/70 mt-2">
              This magic item is from the wiki and cannot be edited.
            </p>
          </div>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base-content/60 mb-4">
              Wiki items are read-only. You can still assign this item to
              entities using the assignment management below.
            </p>
            <div className="flex gap-2">
              <Link href={`/magic-items/${itemId}`} className="flex-1">
                <Button variant="primary" className="gap-2 w-full" size="sm">
                  <Eye className="w-4 h-4" />
                  View Item
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parsedAssignments = parseAssignments(item.assignments);
  const assignmentsByType = groupAssignmentsByType(parsedAssignments);
  const existingAssignments = buildExistingAssignments(parsedAssignments);
  const properties = serializeProperties(item.properties);

  return (
    <div className="container mx-auto p-6">
      <DynamicBreadcrumb
        items={[
          { label: "Campaigns", href: "/campaigns" },
          { label: "Magic Items", href: "/magic-items" },
          { label: item.name, href: `/magic-items/${itemId}` },
          { label: "Edit" },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Magic Item</h1>
          <p className="text-base-content/70 mt-2">
            Update the metadata, description, and properties for {item.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <MagicItemForm
              mode="edit"
              magicItem={{
                id: item.id,
                name: item.name,
                rarity: item.rarity,
                type: item.type,
                description: item.description,
                properties,
                attunementRequired: item.attunementRequired,
                images: item.images,
              }}
            />
          </div>

          {/* Assignment Management */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <MagicItemAssignmentComposer
                  itemId={item.id}
                  existingAssignments={existingAssignments}
                  campaignOptions={campaignOptions}
                />
              </CardContent>
            </Card>

            {/* Current Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignmentBadges(parsedAssignments)}
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
                        <div className="space-y-2">
                          {assignments.slice(0, 3).map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-base-200 bg-base-100 p-3 text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-base-content truncate">
                                  {assignment.entityName}
                                </p>
                                {assignment.campaignTitle && (
                                  <p className="text-xs text-base-content/60 truncate">
                                    {assignment.campaignTitle}
                                  </p>
                                )}
                              </div>
                              <UnassignMagicItemButton
                                itemId={item.id}
                                entityType={assignment.entityType}
                                entityId={assignment.entityId}
                              />
                            </div>
                          ))}
                          {assignments.length > 3 && (
                            <p className="text-xs text-base-content/60 text-center">
                              +{assignments.length - 3} more assignments
                            </p>
                          )}
                        </div>
                      </div>
                    ),
                  )
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Link href={`/magic-items/${itemId}`} className="flex-1">
                <Button variant="warning" className="gap-2 w-full" size="sm">
                  <Eye className="w-4 h-4" />
                  View Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
