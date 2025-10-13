"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { SearchResult } from "../../../lib/services/search";
import DynamicBreadcrumb from "../../../components/ui/dynamic-breadcrumb";
import {
  Search,
  Filter,
  X,
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Sword,
  Star,
  Tag,
} from "lucide-react";

const ENTITY_TYPES = [
  { value: "campaign", label: "Campaigns", icon: BookOpen },
  { value: "adventure", label: "Adventures", icon: MapPin },
  { value: "session", label: "Sessions", icon: Calendar },
  { value: "character", label: "Characters", icon: Users },
  { value: "npc", label: "NPCs", icon: Users },
  { value: "location", label: "Locations", icon: MapPin },
  { value: "magic_item", label: "Magic Items", icon: Star },
  { value: "quest", label: "Quests", icon: Sword },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [entityTypes, setEntityTypes] = useState<string[]>(
    searchParams.get("entityTypes")?.split(",") || [],
  );
  const [dateRange, setDateRange] = useState({
    start: searchParams.get("start") || "",
    end: searchParams.get("end") || "",
  });
  const [tags, setTags] = useState<string[]>(
    searchParams.get("tags")?.split(",") || [],
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "relevance",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("q", query);
      if (entityTypes.length > 0)
        params.set("entityTypes", entityTypes.join(","));
      if (dateRange.start) params.set("start", dateRange.start);
      if (dateRange.end) params.set("end", dateRange.end);
      if (tags.length > 0) params.set("tags", tags.join(","));
      if (sortBy !== "relevance") params.set("sort", sortBy);

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, entityTypes, dateRange, tags, sortBy]);

  // Update URL with search parameters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query);
    if (entityTypes.length > 0)
      params.set("entityTypes", entityTypes.join(","));
    if (dateRange.start) params.set("start", dateRange.start);
    if (dateRange.end) params.set("end", dateRange.end);
    if (tags.length > 0) params.set("tags", tags.join(","));
    if (sortBy !== "relevance") params.set("sort", sortBy);

    const newURL = params.toString()
      ? `/search?${params.toString()}`
      : "/search";
    router.replace(newURL, { scroll: false });
  }, [query, entityTypes, dateRange, tags, sortBy, router]);

  // Auto-search on filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      }
      updateURL();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, entityTypes, dateRange, tags, sortBy, performSearch, updateURL]);

  // Initial search on page load
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch();
    }
  }, [searchParams, performSearch]);

  // Handle entity type filter change
  const handleEntityTypeChange = (entityType: string, checked: boolean) => {
    setEntityTypes((prev) =>
      checked
        ? [...prev, entityType]
        : prev.filter((type) => type !== entityType),
    );
  };

  // Handle tag addition
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Group results by entity type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      if (!groups[result.entityType]) {
        groups[result.entityType] = [];
      }
      groups[result.entityType].push(result);
    });
    return groups;
  }, [results]);

  // Get entity type info
  const getEntityTypeInfo = (entityType: string) => {
    return (
      ENTITY_TYPES.find((type) => type.value === entityType) || {
        label: entityType,
        icon: Search,
      }
    );
  };

  const getEntityUrl = (result: SearchResult) => {
    switch (result.entityType) {
      case "campaign":
        return `/campaigns/${result.id}`;
      case "adventure":
        return `/campaigns/${result.campaignId}/adventures/${result.id}`;
      case "session":
        return `/campaigns/${result.campaignId}/sessions/${result.id}`;
      case "character":
        return `/campaigns/${result.campaignId}/characters/${result.id}`;
      case "npc":
        return `#npc-${result.id}`; // Placeholder until NPC pages are implemented
      case "location":
        return `/campaigns/${result.campaignId}/locations/${result.id}`;
      case "quest":
        return `/campaigns/${result.campaignId}/quests/${result.id}`;
      case "magic_item":
        return `/magic-items/${result.id}`;
      default:
        return "#";
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb items={[{ label: "Search" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Search</h1>
        <p className="text-base-content/70">
          Search across all your campaigns, characters, sessions, and more
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/70 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search campaigns, characters, sessions, locations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
              onKeyPress={(e) => e.key === "Enter" && performSearch()}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
            className="px-6"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {(entityTypes.length > 0 ||
              tags.length > 0 ||
              dateRange.start ||
              dateRange.end) && (
              <Badge variant="secondary" className="ml-2">
                {entityTypes.length +
                  tags.length +
                  (dateRange.start ? 1 : 0) +
                  (dateRange.end ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Entity Types */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Entity Types
                </h4>
                <div className="space-y-2">
                  {ENTITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={type.value}
                          checked={entityTypes.includes(type.value)}
                          onCheckedChange={(checked: boolean) =>
                            handleEntityTypeChange(type.value, checked)
                          }
                        />
                        <label
                          htmlFor={type.value}
                          className="text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </h4>
                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      className="flex-1"
                    />
                    <Button onClick={addTag} size="sm" variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="font-semibold mb-3">Sort By</h4>
                <Select
                  name="sortBy"
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <div className="space-y-6">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-base-content/70">Searching...</p>
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-base-content/70 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-base-content/70">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-base-content/70">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({results.length})</TabsTrigger>
                {Object.entries(groupedResults)
                  .slice(0, 4)
                  .map(([entityType, items]) => {
                    const typeInfo = getEntityTypeInfo(entityType);
                    const Icon = typeInfo.icon;
                    return (
                      <TabsTrigger
                        key={entityType}
                        value={entityType}
                        className="flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {typeInfo.label} ({items.length})
                      </TabsTrigger>
                    );
                  })}
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <SearchResultCard
                      key={`${result.entityType}-${result.id}-${index}`}
                      result={result}
                      getEntityUrl={getEntityUrl}
                    />
                  ))}
                </div>
              </TabsContent>

              {Object.entries(groupedResults).map(([entityType, items]) => (
                <TabsContent
                  key={entityType}
                  value={entityType}
                  className="mt-6"
                >
                  <div className="space-y-4">
                    {items.map((result, index) => (
                      <SearchResultCard
                        key={`${result.entityType}-${result.id}-${index}`}
                        result={result}
                        getEntityUrl={getEntityUrl}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

// Search Result Card Component
function SearchResultCard({
  result,
  getEntityUrl,
}: {
  result: SearchResult;
  getEntityUrl: (result: SearchResult) => string;
}) {
  const getEntityTypeInfo = (entityType: string) => {
    return (
      ENTITY_TYPES.find((type) => type.value === entityType) || {
        label: entityType,
        icon: Search,
      }
    );
  };

  const typeInfo = getEntityTypeInfo(result.entityType);
  const Icon = typeInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {typeInfo.label}
              </Badge>
              {result.relevanceScore && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(result.relevanceScore * 100)}% match
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-1 truncate">
              <Link
                href={getEntityUrl(result)}
                className="hover:text-primary transition-colors"
              >
                {result.title}
              </Link>
            </h3>

            {result.description && (
              <p className="text-base-content/70 text-sm mb-2 line-clamp-2">
                {result.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-base-content/70">
              {result.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(result.createdAt).toLocaleDateString()}
                </span>
              )}

              {result.tags && result.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <div className="flex gap-1">
                    {result.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-1 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {result.tags.length > 3 && (
                      <span>+{result.tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
