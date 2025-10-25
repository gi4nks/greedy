import { Suspense } from "react";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { MagicItemsFilters } from "@/components/magic-items/MagicItemsFilters";
import { MagicItemsList } from "@/components/magic-items/MagicItemsList";
import { Button } from "@/components/ui/button";
import {
  getMagicItemsWithAssignments,
  type MagicItemFilters,
} from "@/lib/actions/magicItems";
import { SUPPORTED_MAGIC_ITEM_ENTITY_TYPES } from "@/lib/magicItems/shared";
import { db } from "@/lib/db";
import { campaigns, magicItems, wikiArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import DynamicBreadcrumb from "../../../components/ui/dynamic-breadcrumb";

function parseJsonColumn<T>(value: unknown): T | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.warn("Failed to parse JSON column", error);
    return null;
  }
}

type SearchParams = Record<string, string | string[] | undefined>;

interface FilterOptionsResult {
  typeOptions: string[];
  rarityOptions: string[];
  campaignOptions: {
    id: number;
    title: string;
  }[];
}

async function getFilterOptions(): Promise<FilterOptionsResult> {
  const [manualTypeRows, manualRarityRows, wikiItemsRaw, campaignRows] =
    await Promise.all([
      db.select({ value: magicItems.type }).from(magicItems),
      db.select({ value: magicItems.rarity }).from(magicItems),
      db
        .select({ parsedData: wikiArticles.parsedData })
        .from(wikiArticles)
        .where(eq(wikiArticles.contentType, "magic-item")),
      db
        .select({ id: campaigns.id, title: campaigns.title })
        .from(campaigns)
        .orderBy(campaigns.title),
    ]);

  // Extract types and rarities from wiki items
  const wikiTypeRarityOptions = wikiItemsRaw
    .map((row) => parseJsonColumn<Record<string, unknown>>(row.parsedData))
    .filter((data): data is Record<string, unknown> => data !== null)
    .flatMap((data) => [
      {
        type: data.type as string | null,
        rarity: data.rarity as string | null,
      },
    ]);

  const manualTypes = manualTypeRows
    .map((row) => row.value)
    .filter((value): value is string => !!value);
  const manualRarities = manualRarityRows
    .map((row) => row.value)
    .filter((value): value is string => !!value);
  const wikiTypes = wikiTypeRarityOptions
    .map((item) => item.type)
    .filter((value): value is string => !!value);
  const wikiRarities = wikiTypeRarityOptions
    .map((item) => item.rarity)
    .filter((value): value is string => !!value);

  const typeOptions = Array.from(
    new Set([...manualTypes, ...wikiTypes]),
  ).sort();
  const rarityOptions = Array.from(
    new Set([...manualRarities, ...wikiRarities]),
  ).sort();
  const campaignOptions = campaignRows
    .map((row) => ({ id: row.id, title: row.title ?? `Campaign ${row.id}` }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    typeOptions,
    rarityOptions,
    campaignOptions,
  };
}

function coerceParam(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

type InitialMagicItemFilters = {
  search?: string;
  type?: string;
  rarity?: string;
  entityType?: string;
  campaignId?: string;
};

function buildFilters(searchParams?: SearchParams): {
  filters: MagicItemFilters;
  initialFilters: InitialMagicItemFilters;
} {
  const search = coerceParam(searchParams?.search);
  const type = coerceParam(searchParams?.type);
  const rarity = coerceParam(searchParams?.rarity);
  const entityTypeParam = coerceParam(searchParams?.entityType);
  const campaignIdParam = coerceParam(searchParams?.campaignId);

  const supportedEntityTypes = new Set(SUPPORTED_MAGIC_ITEM_ENTITY_TYPES);
  const entityType =
    entityTypeParam &&
    supportedEntityTypes.has(
      entityTypeParam as (typeof SUPPORTED_MAGIC_ITEM_ENTITY_TYPES)[number],
    )
      ? (entityTypeParam as MagicItemFilters["entityType"])
      : "all";

  const filters: MagicItemFilters = {
    search: search ?? undefined,
    type: type ?? undefined,
    rarity: rarity ?? undefined,
    entityType,
    campaignId: campaignIdParam
      ? Number.parseInt(campaignIdParam, 10) || undefined
      : undefined,
  };

  const initialFilters = {
    search: search ?? "",
    type: type ?? "",
    rarity: rarity ?? "",
    entityType: entityType ?? "all",
    campaignId: campaignIdParam ?? "",
  };

  return { filters, initialFilters };
}

interface MagicItemsPageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function MagicItemsPage({
  searchParams,
}: MagicItemsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { filters, initialFilters } = buildFilters(resolvedSearchParams);
  const [filterOptions, items] = await Promise.all([
    getFilterOptions(),
    getMagicItemsWithAssignments(filters),
  ]);

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb items={[{ label: "Magic Items" }]} />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Magic Items</h1>
            <p className="text-base-content/70 mt-2">
              Manage and track magical gear across your campaigns
            </p>
          </div>
        </div>
        <Link href="/magic-items/new">
          <Button className="gap-2" variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </Link>
      </div>

      <div className="mb-3">
        <Suspense fallback={null}>
          <MagicItemsFilters
            initialFilters={initialFilters}
            typeOptions={filterOptions.typeOptions}
            rarityOptions={filterOptions.rarityOptions}
            campaignOptions={filterOptions.campaignOptions}
          />
        </Suspense>
      </div>

      <MagicItemsList items={items} />
    </div>
  );
}
