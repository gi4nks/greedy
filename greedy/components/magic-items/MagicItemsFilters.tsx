"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  { value: 'all', label: 'All entities' },
  { value: 'character', label: 'Characters' },
  { value: 'adventure', label: 'Adventures' },
  { value: 'location', label: 'Locations' },
  { value: 'session', label: 'Sessions' },
  { value: 'quest', label: 'Quests' },
];

export function MagicItemsFilters({
  initialFilters,
  typeOptions = [],
  rarityOptions = [],
  campaignOptions = [],
}: MagicItemsFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [type, setType] = useState(initialFilters.type ?? '');
  const [rarity, setRarity] = useState(initialFilters.rarity ?? '');
  const [entityType, setEntityType] = useState(initialFilters.entityType ?? 'all');
  const [campaignId, setCampaignId] = useState(initialFilters.campaignId ?? '');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (type.trim()) params.set('type', type.trim());
    if (rarity.trim()) params.set('rarity', rarity.trim());
    if (entityType && entityType !== 'all') params.set('entityType', entityType);
    if (campaignId.trim()) params.set('campaignId', campaignId.trim());

    const queryString = params.toString();
    router.push(queryString ? `/magic-items?${queryString}` : '/magic-items');
  };

  const handleReset = () => {
    setSearch('');
    setType('');
    setRarity('');
    setEntityType('all');
    setCampaignId('');
    router.push('/magic-items');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-base-content/70" htmlFor="magic-item-search">
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
          <label className="text-sm font-medium text-base-content/70" htmlFor="magic-item-type">
            Type
          </label>
          <select
            id="magic-item-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 w-full rounded-md border border-base-300 bg-base-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All types</option>
            {typeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-base-content/70" htmlFor="magic-item-rarity">
            Rarity
          </label>
          <select
            id="magic-item-rarity"
            value={rarity}
            onChange={(event) => setRarity(event.target.value)}
            className="h-10 w-full rounded-md border border-base-300 bg-base-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All rarities</option>
            {rarityOptions.map((rarityOption) => (
              <option key={rarityOption} value={rarityOption}>
                {rarityOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-base-content/70" htmlFor="magic-item-entity-type">
            Entity type
          </label>
          <select
            id="magic-item-entity-type"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            className="h-10 w-full rounded-md border border-base-300 bg-base-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {entityTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-base-content/70" htmlFor="magic-item-campaign">
            Campaign
          </label>
          <select
            id="magic-item-campaign"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className="h-10 w-full rounded-md border border-base-300 bg-base-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All campaigns</option>
            {campaignOptions.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" variant="primary" className="gap-2">
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} className="gap-2">
          Reset
        </Button>
      </div>
    </form>
  );
}
