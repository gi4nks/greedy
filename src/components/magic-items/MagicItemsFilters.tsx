"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MagicItemsFiltersProps {
  initialFilters: {
    search?: string;
    type?: string;
    rarity?: string;
    entityType?: string;
    campaignId?: string;
  };
  typeOptions?: string[];
  rarityOptions?: string[];
  campaignOptions?: {
    id: number;
    title: string;
  }[];
}

const entityTypeOptions = [
  { value: "all", label: "All entities" },
  { value: "character", label: "Characters" },
  { value: "adventure", label: "Adventures" },
  { value: "location", label: "Locations" },
  { value: "session", label: "Sessions" },
  { value: "quest", label: "Quests" },
];

export function MagicItemsFilters({
  initialFilters,
  typeOptions = [],
  rarityOptions = [],
  campaignOptions = [],
}: MagicItemsFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [type, setType] = useState(initialFilters.type ?? "");
  const [rarity, setRarity] = useState(initialFilters.rarity ?? "");
  const [entityType, setEntityType] = useState(
    initialFilters.entityType ?? "all",
  );
  const [campaignId, setCampaignId] = useState(initialFilters.campaignId ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type.trim()) params.set("type", type.trim());
    if (rarity.trim()) params.set("rarity", rarity.trim());
    if (entityType && entityType !== "all")
      params.set("entityType", entityType);
    if (campaignId.trim()) params.set("campaignId", campaignId.trim());

    const queryString = params.toString();
    router.push(queryString ? `/magic-items?${queryString}` : "/magic-items");
  };

  const handleReset = () => {
    setSearch("");
    setType("");
    setRarity("");
    setEntityType("all");
    setCampaignId("");
    router.push("/magic-items");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <label
            className="text-sm font-medium text-base-content/70"
            htmlFor="magic-item-search"
          >
            Search
          </label>
          <Input
            id="magic-item-search"
            value={search}
            placeholder="Search by name or description"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="magic-item-type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="magic-item-type" className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {typeOptions.map((typeOption) => (
                <SelectItem key={typeOption} value={typeOption}>
                  {typeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="magic-item-rarity">Rarity</Label>
          <Select value={rarity} onValueChange={setRarity}>
            <SelectTrigger id="magic-item-rarity" className="w-full">
              <SelectValue placeholder="All rarities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All rarities</SelectItem>
              {rarityOptions.map((rarityOption) => (
                <SelectItem key={rarityOption} value={rarityOption}>
                  {rarityOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="magic-item-entity-type">Entity type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger id="magic-item-entity-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="magic-item-campaign">Campaign</Label>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger id="magic-item-campaign" className="w-full">
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All campaigns</SelectItem>
              {campaignOptions.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>
                  {campaign.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" variant="primary" className="gap-2" size="sm">
          Apply filters
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-2"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
