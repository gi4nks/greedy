import Link from "next/link";
import { notFound } from "next/navigation";
import { MagicItemForm } from "@/components/magic-items/MagicItemForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { getMagicItemById } from "@/lib/actions/magicItems";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import type { MagicItemAssignableEntity } from "@/lib/magicItems/shared";
import { formatDate } from "@/lib/utils/date";
import { logger } from "@/lib/utils/logger";
import { Eye, Wand2 } from "lucide-react";
import { MagicItemSidebar } from "@/components/magic-items/MagicItemSidebar";

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
      <PageContainer>
        <div className="container mx-auto px-4 py-6 md:p-6">
          <DynamicBreadcrumb
            items={[
              { label: "Magic Items", href: "/magic-items" },
              { label: item.name, href: `/magic-items/${itemId}` },
              { label: "Edit" },
            ]}
          />

          <div className="mb-6 mt-6">
            <div className="flex items-center gap-3">
              <Wand2 className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Edit Magic Item</h1>
                <p className="text-base-content/70">This magic item is from the wiki and cannot be edited.</p>
              </div>
            </div>
          </div>

          <Card className="max-w-2xl">
            <CardContent className="p-6">
              <p className="text-base-content/60">
                Wiki items are read-only. You can still assign this item to
                entities using the assignment management below.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const properties = serializeProperties(item.properties);

  return (
    <PageContainer>
      <div className="container mx-auto px-4 py-6 md:p-6">
        <DynamicBreadcrumb
          items={[
            { label: "Magic Items", href: "/magic-items" },
            { label: item.name, href: `/magic-items/${itemId}` },
            { label: "Edit" },
          ]}
        />

        <div className="mb-6 mt-6">
          <div className="flex items-center gap-3">
            <Wand2 className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Edit Magic Item</h1>
              <p className="text-base-content/70">Update item details and assignments</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Magic Item Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
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
                    tags: item.tags,
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <MagicItemSidebar
              item={item}
              campaignOptions={campaignOptions}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}