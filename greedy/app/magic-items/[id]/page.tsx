import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicItemAssignmentComposer } from '@/components/magic-items/MagicItemAssignmentComposer';
import { UnassignMagicItemButton } from '@/components/magic-items/UnassignMagicItemButton';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { EntityImageCarousel } from '@/components/ui/image-carousel';
import { getMagicItemById, deleteMagicItem } from '@/lib/actions/magicItems';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { parseImagesJson, type ImageInfo } from '@/lib/utils/imageUtils.client';
import { formatDate } from '@/lib/utils/date';
import type { MagicItemAssignableEntity } from '@/lib/magicItems/shared';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { Trash2 } from 'lucide-react';

function parseProperties(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return null;
    }

    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch (error) {
      console.warn('Failed to parse magic item properties', error);
      return null;
    }
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return null;
}

interface MagicItemDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Unknown';
  }

  if (typeof value === 'string') {
    return value.trim() === '' ? 'Unknown' : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    console.warn('Failed to stringify magic item property value', error);
    return 'Unknown';
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

function parseAssignments(assignments: {
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
}[]) {
  return [...assignments]
    .sort((a, b) => {
      const aTime = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const bTime = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
      return bTime - aTime;
    })
    .map((assignment) => ({
      ...assignment,
      assignedDateLabel: assignment.assignedAt ? formatDate(assignment.assignedAt) : null,
    }));
}

type ParsedAssignment = ReturnType<typeof parseAssignments>[number];

function buildAssignmentSummary(assignments: ParsedAssignment[]) {
  const summary = new Map<string, number>();
  assignments.forEach((assignment) => {
    summary.set(assignment.entityType, (summary.get(assignment.entityType) ?? 0) + 1);
  });
  return Array.from(summary.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function groupAssignmentsByType(assignments: ParsedAssignment[]) {
  return assignments.reduce<Record<string, ParsedAssignment[]>>((acc, assignment) => {
    const key = assignment.entityType;
    acc[key] = acc[key] ?? [];
    acc[key].push(assignment);
    return acc;
  }, {});
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
    console.warn('Failed to parse magic item images', error);
    return [];
  }
}

function metadataBadges(item: {
  rarity: string | null;
  type: string | null;
  attunementRequired: boolean | null;
  source: 'manual' | 'wiki';
}) {
  const badges: { id: string; content: string; variant: 'default' | 'secondary' | 'outline'; className?: string }[] = [];

  if (item.rarity) {
    badges.push({ id: 'rarity', content: item.rarity, variant: 'outline' });
  }

  if (item.type) {
    badges.push({ id: 'type', content: item.type, variant: 'secondary' });
  }

  badges.push({
    id: 'source',
    content: item.source,
    variant: item.source === 'wiki' ? 'default' : 'outline',
    className: item.source === 'wiki' ? 'bg-blue-500 text-white' : ''
  });

  if (item.attunementRequired) {
    badges.push({ id: 'attunement', content: 'Attunement required', variant: 'secondary', className: 'bg-emerald-500 text-white' });
  }

  return badges;
}

function assignmentBadges(assignments: ParsedAssignment[]) {
  if (!assignments.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {assignments.slice(0, 5).map((assignment) => (
        <Badge key={`${assignment.entityType}-${assignment.entityId}`} variant="secondary" className="capitalize">
          {assignment.entityType} • {assignment.entityName ?? 'Unnamed'}
        </Badge>
      ))}
    </div>
  );
}

function DeleteMagicItemForm({ itemId, itemName }: { itemId: number; itemName: string }) {
  async function handleDelete() {
    'use server';

    try {
      await deleteMagicItem(itemId);
      revalidatePath('/magic-items');
      // Don't redirect here - let the client handle navigation
    } catch (error) {
      console.error('Failed to delete magic item', error);
      // In Next.js server actions, throwing an error will show it in the UI
      throw new Error(`Failed to delete magic item "${itemName}". Please try again.`);
    }
  }

  return (
    <form 
      action={handleDelete}
      onSubmit={(e) => {
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
          e.preventDefault();
          return;
        }
        
        // After successful submission, redirect to magic items list
        setTimeout(() => {
          window.location.href = '/magic-items';
        }, 100);
      }}
    >
        <Button variant="neutral" className="gap-2" size="sm" type="submit">
            <Trash2 className="w-4 h-4" />
            Delete
        </Button>
    </form>
  );
}

export default async function MagicItemDetailPage({ params }: MagicItemDetailPageProps) {
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
    <div className="container mx-auto p-6">
      <DynamicBreadcrumb items={[{ label: "Campaigns", href: "/campaigns" }, { label: "Magic Items", href: "/magic-items" }, { label: item.name }]} />

      {/* Magic Item Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-wrap gap-2 text-sm text-base-content/70">
                {metadataBadges(item).map((badge) => (
                  <Badge key={badge.id} variant={badge.variant} className={`capitalize ${badge.className ?? ''}`}>
                    {badge.content}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-base-content/60">
                <span>ID {item.id}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-base-content/60 mt-2">
              <span>Created {formatDate(item.createdAt)}</span>
              <span>Updated {formatDate(item.updatedAt)}</span>
            </div>
            {assignmentBadges(parsedAssignments)}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <MagicItemAssignmentComposer
              itemId={item.id}
              existingAssignments={existingAssignments}
              campaignOptions={campaignOptions}
            />
            {item.source === 'manual' && (
              <>
                <Link href={`/magic-items/${item.id}/edit`}>
                  <Button variant="secondary" className="w-full gap-2 sm:w-auto">
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
          <EntityImageCarousel images={images} entityType="magic-item" />
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
              <MarkdownRenderer content={item.description} className="prose-base" />
            ) : (
              <p className="italic text-base-content/60">No description available for this magic item.</p>
            )}

            {properties && Object.keys(properties).length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">Properties</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(properties).map(([key, value]) => (
                    <div key={key} className="rounded-md border border-base-200 bg-base-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">{key}</p>
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
            Object.entries(assignmentsByType).map(([entityType, assignments]) => (
              <div key={entityType} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {entityType}
                  </Badge>
                  <span className="text-xs text-base-content/60">
                    {assignments.length} assignment{assignments.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="space-y-3 rounded-md border border-base-200 bg-base-100 p-4 text-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-base font-medium text-base-content">{assignment.entityName}</p>
                          {assignment.entityDescription && (
                            <p className="text-xs text-base-content/60">{assignment.entityDescription}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
                            {assignment.campaignTitle && (
                              <Badge variant="secondary">{assignment.campaignTitle}</Badge>
                            )}
                            {assignment.source && <Badge variant="outline">Source: {assignment.source}</Badge>}
                            {assignment.assignedDateLabel && <span>Assigned {assignment.assignedDateLabel}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <UnassignMagicItemButton
                            itemId={item.id}
                            entityType={assignment.entityType}
                            entityId={assignment.entityId}
                          />
                          {assignment.entityPath && (
                            <Link href={assignment.entityPath} className="text-xs text-primary underline hover:text-primary/80">
                              View entity
                            </Link>
                          )}
                        </div>
                      </div>
                      {assignment.notes && (
                        <p className="text-sm text-base-content">{assignment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
