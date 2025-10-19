"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUPPORTED_MAGIC_ITEM_ENTITY_TYPES,
  type AssignableEntityOption,
  type MagicItemAssignableEntity,
} from "@/lib/magicItems/shared";
import { cn } from "@/lib/utils";
import { EyeOff, Plus, Save } from "lucide-react";

interface MagicItemAssignmentComposerProps {
  itemId: number;
  existingAssignments: Array<{
    entityType: MagicItemAssignableEntity;
    entityId: number;
  }>;
  campaignOptions: { id: number; title: string }[];
}

const ENTITY_LABELS: Record<MagicItemAssignableEntity, string> = {
  character: "Character",
  location: "Location",
  adventure: "Adventure",
  session: "Session",
};

interface FetchState {
  isLoading: boolean;
  error: string | null;
  results: AssignableEntityOption[];
}

const INITIAL_FETCH_STATE: FetchState = {
  isLoading: false,
  error: null,
  results: [],
};

export function MagicItemAssignmentComposer({
  itemId,
  existingAssignments,
  campaignOptions,
}: MagicItemAssignmentComposerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [entityType, setEntityType] =
    useState<MagicItemAssignableEntity>("character");
  const [campaignId, setCampaignId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AssignableEntityOption[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const existingAssignmentKeys = useMemo(() => {
    return new Set(
      existingAssignments.map(
        (assignment) => `${assignment.entityType}:${assignment.entityId}`,
      ),
    );
  }, [existingAssignments]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [search, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function loadResults() {
      setFetchState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params = new URLSearchParams();
        params.set("entityType", entityType);
        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }
        if (campaignId) {
          params.set("campaignId", campaignId);
        }
        params.set("limit", "20");

        const response = await fetch(
          `/api/magic-items/assignable?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load entities");
        }

        const data = (await response.json()) as AssignableEntityOption[];

        if (!isActive) {
          return;
        }

        const filtered = data.filter((option) => {
          const key = `${option.entityType}:${option.id}`;
          if (existingAssignmentKeys.has(key)) {
            return false;
          }
          return !selected.some(
            (selectedOption) =>
              selectedOption.id === option.id &&
              selectedOption.entityType === option.entityType,
          );
        });

        setFetchState({ isLoading: false, error: null, results: filtered });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("Failed to fetch assignable entities", error);
        setFetchState({
          isLoading: false,
          error: "Unable to load entities. Please try again.",
          results: [],
        });
      }
    }

    loadResults();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [
    entityType,
    debouncedSearch,
    campaignId,
    isOpen,
    existingAssignmentKeys,
    selected,
  ]);

  const handleOpen = () => {
    setIsOpen(true);
    setAssignError(null);
  };

  const resetForm = () => {
    setSelected([]);
    setAssignError(null);
    setSearch("");
    setDebouncedSearch("");
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleEntityTypeChange = (value: string) => {
    if (
      !SUPPORTED_MAGIC_ITEM_ENTITY_TYPES.includes(
        value as MagicItemAssignableEntity,
      )
    ) {
      return;
    }

    setEntityType(value as MagicItemAssignableEntity);
    setSelected([]);
    setSearch("");
    setDebouncedSearch("");
    setCampaignId("");
  };

  const handleToggleSelection = (option: AssignableEntityOption) => {
    setSelected((prev) => {
      const exists = prev.some(
        (item) =>
          item.id === option.id && item.entityType === option.entityType,
      );
      if (exists) {
        return prev.filter(
          (item) =>
            !(item.id === option.id && item.entityType === option.entityType),
        );
      }
      return [...prev, option];
    });
  };

  const handleAssign = () => {
    if (!selected.length) {
      setAssignError("Select at least one entity to assign this item.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/magic-items/${itemId}/assign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entityType,
            entityIds: selected.map((item) => item.id),
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Failed to assign magic item.");
        }

        handleClose();
        router.refresh();
      } catch (error) {
        console.error("Failed to assign magic item", error);
        setAssignError(
          (error as Error).message || "Failed to assign magic item.",
        );
      }
    });
  };

  const renderResult = (option: AssignableEntityOption) => {
    const isSelected = selected.some(
      (item) => item.id === option.id && item.entityType === option.entityType,
    );
    const description = option.description;

    return (
      <div
        key={`${option.entityType}-${option.id}`}
        className={cn(
          "flex items-center justify-between gap-4 rounded-md border border-base-200 bg-base-100 p-3 text-sm transition",
          isSelected && "border-primary/70 bg-primary/5",
        )}
      >
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{option.name}</span>
          <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
            <span className="capitalize">
              {ENTITY_LABELS[option.entityType]}
            </span>
            {option.campaignTitle && (
              <span>Campaign: {option.campaignTitle}</span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={isSelected ? "secondary" : "outline"}
          className="whitespace-nowrap"
          onClick={() => handleToggleSelection(option)}
        >
          {isSelected ? "Remove" : "Select"}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className="gap-2"
        onClick={handleOpen}
        size="sm"
      >
        <Plus className="w-4 h-4" />
        Assign
      </Button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-3xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Assign magic item</h2>
                <p className="text-sm text-base-content/70">
                  Select one or more entities to receive this magic item.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignment-entity-type">Entity type</Label>
                <Select
                  value={entityType}
                  name="assignment-entity-type"
                  onValueChange={handleEntityTypeChange}
                >
                  <SelectTrigger id="assignment-entity-type">
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_MAGIC_ITEM_ENTITY_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="capitalize"
                      >
                        {ENTITY_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-campaign-filter">
                  Campaign filter
                </Label>
                <Select
                  value={campaignId}
                  name="assignment-campaign-filter"
                  onValueChange={setCampaignId}
                >
                  <SelectTrigger id="assignment-campaign-filter">
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All campaigns</SelectItem>
                    {campaignOptions.map((campaign) => (
                      <SelectItem key={campaign.id} value={String(campaign.id)}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-search">Search entities</Label>
              <Input
                id="assignment-search"
                value={search}
                placeholder={`Search for a ${ENTITY_LABELS[entityType].toLowerCase()}`}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                  Available entities
                </h3>
                {fetchState.isLoading && (
                  <span className="text-xs text-base-content/60">Loading…</span>
                )}
              </div>

              {fetchState.error && (
                <div className="rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error">
                  {fetchState.error}
                </div>
              )}

              {!fetchState.isLoading &&
              !fetchState.error &&
              fetchState.results.length === 0 ? (
                <div className="rounded-md border border-dashed border-base-300 p-4 text-sm text-base-content/60">
                  No entities found. Adjust your filters or create the entity
                  first.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {fetchState.results.map(renderResult)}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                Selected entities ({selected.length})
              </h3>
              {selected.length === 0 ? (
                <p className="rounded-md border border-dashed border-base-300 p-4 text-sm text-base-content/60">
                  Select at least one entity to assign this magic item.
                </p>
              ) : (
                <div className="space-y-2">
                  {selected.map((option) => (
                    <div
                      key={`${option.entityType}-${option.id}`}
                      className="flex items-center justify-between gap-4 rounded-md border border-base-200 bg-base-100 p-3 text-sm"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium">{option.name}</span>
                        <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
                          <span className="capitalize">
                            {ENTITY_LABELS[option.entityType]}
                          </span>
                          {option.campaignTitle && (
                            <span>Campaign: {option.campaignTitle}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleSelection(option)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {assignError && (
              <div className="rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error">
                {assignError}
              </div>
            )}

            <div className="modal-action flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="primary"
                className="gap-2"
                onClick={handleAssign}
                disabled={isSubmitting || selected.length === 0}
                size="sm"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Assigning…" : "Assign"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleClose}
                disabled={isSubmitting}
                size="sm"
              >
                <EyeOff className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
