"use client";

import { useState, useEffect } from "react";
import {
  WikiDataService,
  WikiArticle,
  WikiArticleDetails,
} from "../../../lib/services/wiki-data";
import {
  EditionAwareImportService,
  GameEdition,
} from "../../../lib/services/edition-aware-import";
import { DnD5eToolsService } from "../../../lib/services/dnd5e-tools";
import { Campaign } from "../../../lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import DynamicBreadcrumb from "../../../components/ui/dynamic-breadcrumb";
import { WikiItemAssignmentDialog } from "../../../components/wiki/WikiItemAssignmentDialog";
import {
  detectWikiItemCategory,
  getCategoryDisplayInfo,
  WikiItemCategory,
} from "../../../lib/utils/wiki-categories";
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs";
import { Label } from "../../../components/ui/label";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import WikiContent from "@/components/ui/wiki-content";

interface FeedbackMessage {
  type: "success" | "error" | "info";
  message: string;
}

interface ImportedArticle {
  id: number;
  title: string;
  contentType: string;
  wikiUrl: string | null;
  rawContent: string | null;
  parsedData: unknown;
  importedFrom: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  entityRelationships: Array<{
    id: number;
    entityType: string;
    entityId: number;
    relationshipType: string;
    relationshipData: unknown;
  }>;
}

function ImportedArticlesTab() {
  const [articles, setArticles] = useState<ImportedArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filter articles based on search query
  const filteredArticles = articles.filter((article) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.contentType.toLowerCase().includes(query) ||
      (article.rawContent && article.rawContent.toLowerCase().includes(query)) ||
      (article.importedFrom && article.importedFrom.toLowerCase().includes(query))
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Load articles and campaigns on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load articles
        const articlesResponse = await fetch("/api/wiki-articles");
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          setArticles(articlesData);
        }

        // Load campaigns to set default campaign
        const campaignsResponse = await fetch("/api/campaigns/with-editions");
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          // Set first campaign as default if available
          if (campaignsData.length > 0) {
            setSelectedCampaignId(campaignsData[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setFeedbackMessage({
          type: "error",
          message: "Failed to load data",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleExpand = (articleId: number) => {
    setExpandedArticles((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(articleId)) {
        newExpanded.delete(articleId);
      } else {
        newExpanded.add(articleId);
      }
      return newExpanded;
    });
  };

  const handleDelete = async (articleId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/wiki-articles/${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setArticles((prev) => prev.filter((article) => article.id !== articleId));
        setFeedbackMessage({
          type: "success",
          message: `Successfully deleted "${title}"`,
        });
        // Reset to first page if current page becomes empty
        const remainingArticles = articles.filter((article) => article.id !== articleId);
        const newFilteredCount = remainingArticles.filter((article) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            article.title.toLowerCase().includes(query) ||
            article.contentType.toLowerCase().includes(query) ||
            (article.rawContent && article.rawContent.toLowerCase().includes(query)) ||
            (article.importedFrom && article.importedFrom.toLowerCase().includes(query))
          );
        }).length;
        const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } else {
        throw new Error("Failed to delete article");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      setFeedbackMessage({
        type: "error",
        message: `Failed to delete "${title}": ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  const renderArticleContent = (article: ImportedArticle): string => {
    if (article.rawContent) {
      // For adnd2e-wiki articles, convert MediaWiki markup to HTML
      if (article.importedFrom === "adnd2e-wiki") {
        return WikiDataService.wikitextToHtml(article.rawContent);
      } else if (article.importedFrom === "dnd5e-tools") {
        // 5e.tools content is already formatted as markdown/HTML
        return article.rawContent;
      } else {
        // Unknown source, try to detect format or return as-is
        return article.rawContent;
      }
    }
    return "No content available";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-base-content/70">Loading imported articles...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {feedbackMessage && (
        <div
          className={`alert ${
            feedbackMessage.type === "success"
              ? "alert-success"
              : feedbackMessage.type === "error"
                ? "alert-error"
                : "alert-info"
          }`}
        >
          {feedbackMessage.type === "success" && (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {feedbackMessage.type === "error" && (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {feedbackMessage.type === "info" && (
            <Info className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{feedbackMessage.message}</p>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-current hover:opacity-70 ml-4"
          >
            ×
          </button>
        </div>
      )}

      {articles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-base-content/70 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No imported articles</h3>
            <p className="text-base-content/70">
              You haven&apos;t imported any wiki articles yet. Use the Import tab to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search articles by title, type, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-sm py-3"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <Search className="w-4 h-4" />
                  {filteredArticles.length} of {articles.length} articles
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card>
            <CardHeader>
              <CardTitle>Imported Articles ({filteredArticles.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paginatedArticles.map((article) => {
                const categoryInfo = getCategoryDisplayInfo(article.contentType as WikiItemCategory);

                return (
                  <Card key={article.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div
                            className="cursor-pointer hover:bg-base-200 transition-colors -m-2 p-2 rounded flex justify-between items-start"
                            onClick={() => handleToggleExpand(article.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {expandedArticles.has(article.id) ? (
                                  <ChevronDown className="w-5 h-5 text-base-content/70 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-base-content/70 flex-shrink-0" />
                                )}
                                <h3 className="font-semibold text-lg">{article.title}</h3>
                              </div>
                              <div className="flex gap-2 mt-2 flex-wrap ml-7">
                                <Badge variant="outline">
                                  {article.importedFrom === "dnd5e-tools"
                                    ? "D&D 5e (5e.tools)"
                                    : article.importedFrom === "adnd2e-wiki"
                                      ? "AD&D 2e (Fandom Wiki)"
                                      : "Unknown Source"}
                                </Badge>
                                <Badge className={`${categoryInfo.color} text-white`}>
                                  {categoryInfo.icon} {categoryInfo.label}
                                </Badge>
                                {article.entityRelationships.length > 0 && (
                                  <Badge variant="secondary">
                                    {article.entityRelationships.length} assignment{article.entityRelationships.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {selectedCampaignId && (
                            <WikiItemAssignmentDialog
                              itemId={article.id}
                              itemTitle={article.title}
                              itemCategory={article.contentType as WikiItemCategory}
                              campaignId={selectedCampaignId}
                              onAssign={async (assignment) => {
                                try {
                                  // Create the entity relationship
                                  const relationshipResponse = await fetch(
                                    `/api/wiki-articles/${article.id}/entities`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        entityType: assignment.entityType,
                                        entityId: assignment.entityId,
                                        relationshipType: "referenced",
                                        relationshipData: assignment.notes
                                          ? { notes: assignment.notes }
                                          : {},
                                      }),
                                    },
                                  );

                                  if (!relationshipResponse.ok) {
                                    throw new Error(
                                      "Failed to create entity relationship",
                                    );
                                  }

                                  // Refresh articles to show updated relationships
                                  const refreshResponse = await fetch("/api/wiki-articles");
                                  if (refreshResponse.ok) {
                                    const refreshedData = await refreshResponse.json();
                                    setArticles(refreshedData);
                                  }

                                  setFeedbackMessage({
                                    type: "success",
                                    message: `Successfully assigned "${article.title}" to ${assignment.entityType} "${assignment.entityName}"`,
                                  });
                                } catch (error) {
                                  console.error("Assignment error:", error);
                                  setFeedbackMessage({
                                    type: "error",
                                    message: `Failed to assign "${article.title}": ${error instanceof Error ? error.message : "Unknown error"}`,
                                  });
                                }
                              }}
                            />
                          )}
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={() => handleDelete(article.id, article.title)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    {expandedArticles.has(article.id) && (
                      <div className="bg-base-200 border-t">
                        <div className="p-4">
                          <WikiContent
                            content={renderArticleContent(article)}
                            importedFrom={article.importedFrom}
                            className="prose-sm"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WikiImport() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<WikiArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(
    new Set(),
  );
  const [fullContentArticles, setFullContentArticles] = useState<
    Map<number, WikiArticleDetails>
  >(new Map());
  const [feedbackMessage, setFeedbackMessage] =
    useState<FeedbackMessage | null>(null);

  // Edition-aware state
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [gameEdition, setGameEdition] = useState<GameEdition>("dnd5e");

  // Load campaigns on component mount
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        // Use getCampaigns to get campaigns with game edition info
        const response = await fetch("/api/campaigns/with-editions");
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        } else {
          // Fallback to regular campaigns endpoint
          const fallbackResponse = await fetch("/api/campaigns");
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setCampaigns(fallbackData);
          }
        }
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      }
    };

    loadCampaigns();
  }, []);

  // Detect campaign edition when campaign is selected
  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0) {
      const campaign = campaigns.find((c) => c.id === selectedCampaignId);
      if (campaign) {
        const detectedEdition = EditionAwareImportService.detectGameEdition(
          campaign.gameEditionName || campaign.gameEditionVersion || undefined,
        );
        setGameEdition(detectedEdition);
      }
    }
  }, [selectedCampaignId, campaigns]);

  // Get available categories for current edition
  const availableCategories =
    EditionAwareImportService.getCategoriesForEdition(gameEdition);

  // Legacy categories for backward compatibility
  const categories = [
    { id: "all", name: "All Content" },
    { id: "monsters", name: "Monsters" },
    { id: "spells", name: "Spells" },
    { id: "magic-items", name: "Magic Items" },
    { id: "races", name: "Races" },
    { id: "classes", name: "Classes" },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (!selectedCampaignId) {
      setFeedbackMessage({
        type: "error",
        message: "Please select a campaign first",
      });
      return;
    }

    setLoading(true);
    try {
      // Use EditionAwareImportService for unified search
      const results: WikiArticle[] = await EditionAwareImportService.search(
        selectedCategory,
        searchQuery,
        selectedCampaignId,
      );

      setSearchResults(results);
      setFeedbackMessage(null);
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during search";
      setFeedbackMessage({ type: "error", message: errorMessage });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSearch();
    }
  };

  const handleExpand = async (article: WikiArticle) => {
    setExpandedArticles((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(article.id)) {
        newExpanded.delete(article.id);
        return newExpanded;
      } else {
        newExpanded.add(article.id);
        return newExpanded;
      }
    });

    // Load full content if not already loaded
    if (
      !fullContentArticles.has(article.id) &&
      !expandedArticles.has(article.id)
    ) {
      try {
        if (article.id >= 5000000) {
          // This is a 5e.tools article, load detailed content
          const detailedContent = await load5eToolsContent(article);
          setFullContentArticles((prev) =>
            new Map(prev).set(article.id, detailedContent),
          );
        } else {
          // AD&D 2e wiki article
          const articleDetail =
            await WikiDataService.getArticleFullContent(article);
          setFullContentArticles((prev) =>
            new Map(prev).set(article.id, articleDetail),
          );
        }
      } catch (error) {
        console.error("Error loading article details:", error);
        setExpandedArticles((prev) => new Set(prev).add(article.id));
      }
    } else if (!expandedArticles.has(article.id)) {
      const fullContent = fullContentArticles.get(article.id);
      if (fullContent) {
        setFullContentArticles((prev) =>
          new Map(prev).set(article.id, fullContent),
        );
      }
      setExpandedArticles((prev) => new Set(prev).add(article.id));
    }
  };

  const renderArticleContent = (article: WikiArticle): string => {
    const details = fullContentArticles.get(article.id);
    if (details?.content) {
      return WikiDataService.wikitextToHtml(details.content);
    } else if (details?.extract) {
      return details.extract;
    }
    return "Loading content...";
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb items={[{ label: "Wiki Import" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wiki Import</h1>
        <p className="text-base-content/70">
          Import content from various D&D sources based on your campaign edition
        </p>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="imported">Imported</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            {feedbackMessage && (
              <div
                className={`alert ${
                  feedbackMessage.type === "success"
                    ? "alert-success"
                    : feedbackMessage.type === "error"
                      ? "alert-error"
                      : "alert-info"
                }`}
              >
                {feedbackMessage.type === "success" && (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                )}
                {feedbackMessage.type === "error" && (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                {feedbackMessage.type === "info" && (
                  <Info className="w-5 h-5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{feedbackMessage.message}</p>
                </div>
                <button
                  onClick={() => setFeedbackMessage(null)}
                  className="text-current hover:opacity-70 ml-4"
                >
                  ×
                </button>
              </div>
            )}

            {/* Campaign Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Campaign Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-select">Select Campaign</Label>
                  <Select
                    name="campaign-select"
                    value={selectedCampaignId?.toString() || ""}
                    onValueChange={(value) =>
                      setSelectedCampaignId(value ? Number(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem
                          key={campaign.id}
                          value={campaign.id.toString()}
                        >
                          {campaign.title} (
                          {campaign.gameEditionName ||
                            campaign.gameEditionVersion ||
                            "Unknown Edition"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {gameEdition && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Detected Edition: {gameEdition.toUpperCase()}
                    </Badge>
                  </div>
                )}

                {availableCategories.length > 0 && (
                  <div className="text-sm text-base-content/70">
                    <span className="font-medium">Available Content Types:</span>{" "}
                    {availableCategories.map((cat) => cat.name).join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Enter search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="text-sm py-3"
                    />
                  </div>
                  <div className="w-48">
                    <Select
                      name="selectedCategory"
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                      className="sm"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-6"
                    size="sm"
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results ({searchResults.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searchResults.map((article) => {
                    const fullArticle = fullContentArticles.get(article.id);
                    const category = detectWikiItemCategory(
                      article.title,
                      fullArticle?.content,
                    );
                    const categoryInfo = getCategoryDisplayInfo(category);

                    return (
                      <Card key={article.id} className="overflow-hidden">
                        <div className="p-4">
                          <div
                            className="cursor-pointer hover:bg-base-200 transition-colors -m-4 p-4"
                            onClick={() => handleExpand(article)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {article.title}
                                </h3>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline">
                                    {article.id >= 5000000
                                      ? "D&D 5e (5e.tools)"
                                      : "AD&D 2e (Fandom Wiki)"}
                                  </Badge>
                                  <Badge
                                    className={`${categoryInfo.color} text-white`}
                                  >
                                    {categoryInfo.icon} {categoryInfo.label}
                                  </Badge>
                                </div>
                              </div>
                              {expandedArticles.has(article.id) ? (
                                <ChevronDown className="w-5 h-5 text-base-content/70" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-base-content/70" />
                              )}
                            </div>
                          </div>

                          {/* Assignment button - only show if campaign is selected */}
                          {selectedCampaignId && (
                            <div className="mt-3 pt-3 border-t flex justify-end">
                              <WikiItemAssignmentDialog
                                itemId={article.id}
                                itemTitle={article.title}
                                itemCategory={category}
                                campaignId={selectedCampaignId}
                                onAssign={async (assignment) => {
                                  try {
                                    // Get the full content for parsing
                                    const fullContent = fullContentArticles.get(
                                      article.id,
                                    );
                                    let parsedData = {};

                                    // For 5e.tools items, use the already parsed data from load5eToolsContent
                                    if (article.id >= 5000000 && fullContent) {
                                      // The parsedData is already available from load5eToolsContent
                                      // We need to extract it from the formatted content or store it properly
                                      const is5eTools = article.id >= 5000000;
                                      if (is5eTools) {
                                        // For 5e.tools items, we need to re-parse using the correct service
                                        let searchResults: any[] = [];
                                        if (article.url.includes("/items/")) {
                                          searchResults = await DnD5eToolsService.searchMagicItems();
                                        }
                                        const item = searchResults.find(
                                          (result: any) => result.name.toLowerCase() === article.title.toLowerCase()
                                        );
                                        if (item) {
                                          parsedData = DnD5eToolsService.parseMagicItemForImport(item);
                                        }
                                      }
                                    } else if (fullContent?.content) {
                                      // Parse the content based on category for AD&D 2e wiki
                                      if (category === "spell") {
                                        parsedData = WikiDataService.parseSpellData(
                                          fullContent.content,
                                        );
                                      } else if (category === "monster") {
                                        parsedData =
                                          WikiDataService.parseMonsterData(
                                            fullContent.content,
                                          );
                                      } else if (category === "magic-item") {
                                        parsedData =
                                          WikiDataService.parseMagicItemData(
                                            fullContent.content,
                                          );
                                      }
                                    }

                                    // First, create or find the wiki article in our database
                                    const articleResponse = await fetch(
                                      "/api/wiki-articles",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          title: article.title,
                                          contentType: category,
                                          wikiUrl:
                                            article.id >= 5000000
                                              ? article.url
                                              : `https://adnd2e.fandom.com${article.url}`,
                                          rawContent: fullContent?.content || "",
                                          parsedData: parsedData,
                                          importedFrom:
                                            article.id >= 5000000
                                              ? "dnd5e-tools"
                                              : "adnd2e-wiki",
                                        }),
                                      },
                                    );

                                    if (!articleResponse.ok) {
                                      throw new Error(
                                        "Failed to create wiki article",
                                      );
                                    }

                                    const createdArticle =
                                      await articleResponse.json();

                                    // Then create the entity relationship
                                    const relationshipResponse = await fetch(
                                      `/api/wiki-articles/${createdArticle.id}/entities`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          entityType: assignment.entityType,
                                          entityId: assignment.entityId,
                                          relationshipType: "referenced",
                                          relationshipData: assignment.notes
                                            ? { notes: assignment.notes }
                                            : {},
                                        }),
                                      },
                                    );

                                    if (!relationshipResponse.ok) {
                                      throw new Error(
                                        "Failed to create entity relationship",
                                      );
                                    }

                                    setFeedbackMessage({
                                      type: "success",
                                      message: `Successfully assigned "${article.title}" to ${assignment.entityType} "${assignment.entityName}"`,
                                    });
                                  } catch (error) {
                                    console.error("Assignment error:", error);
                                    setFeedbackMessage({
                                      type: "error",
                                      message: `Failed to assign "${article.title}": ${error instanceof Error ? error.message : "Unknown error"}`,
                                    });
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {expandedArticles.has(article.id) && (
                          <div className="bg-base-200 border-t">
                            <div className="p-4">
                              <WikiContent
                                content={renderArticleContent(article)}
                                importedFrom={article.id >= 5000000 ? "dnd5e-tools" : "adnd2e-wiki"}
                                className="prose-sm"
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {searchResults.length === 0 && !loading && searchQuery && (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto text-base-content/70 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-base-content/70">
                    No results found for &quot;{searchQuery}&quot;. Try a different
                    search term or category.
                  </p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-base-content/70">Searching...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="imported" className="space-y-6">
            <ImportedArticlesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Load detailed content for 5e.tools articles
 */
async function load5eToolsContent(article: WikiArticle): Promise<WikiArticleDetails> {
  try {
    // Determine the content type from the URL pattern
    let contentType: "spell" | "monster" | "magic-item" | "race" | "class" | null = null;
    let searchResults: (import("../../../lib/services/dnd5e-tools").DnD5eSpell | import("../../../lib/services/dnd5e-tools").DnD5eMonster | import("../../../lib/services/dnd5e-tools").DnD5eItem | import("../../../lib/services/dnd5e-tools").DnD5eRace | import("../../../lib/services/dnd5e-tools").DnD5eClass)[] = [];

    if (article.url.includes("/spells/")) {
      contentType = "spell";
      searchResults = await DnD5eToolsService.searchSpells();
    } else if (article.url.includes("/monsters/")) {
      contentType = "monster";
      searchResults = await DnD5eToolsService.searchMonsters();
    } else if (article.url.includes("/items/")) {
      contentType = "magic-item";
      searchResults = await DnD5eToolsService.searchMagicItems();
    } else if (article.url.includes("/races/")) {
      contentType = "race";
      searchResults = await DnD5eToolsService.searchRaces();
    } else if (article.url.includes("/classes/")) {
      contentType = "class";
      searchResults = await DnD5eToolsService.searchClasses();
    }

    if (!contentType || searchResults.length === 0) {
      return {
        id: article.id,
        title: article.title,
        url: article.url,
        extract: "D&D 5e content from 5e.tools",
        content: "Unable to load detailed content for this item.",
        isFullContent: false,
      };
    }

    // Find the item by name
    const item = searchResults.find(
      (result: import("../../../lib/services/dnd5e-tools").DnD5eSpell | import("../../../lib/services/dnd5e-tools").DnD5eMonster | import("../../../lib/services/dnd5e-tools").DnD5eItem | import("../../../lib/services/dnd5e-tools").DnD5eRace | import("../../../lib/services/dnd5e-tools").DnD5eClass) =>
        result.name.toLowerCase() === article.title.toLowerCase()
    );

    if (!item) {
      return {
        id: article.id,
        title: article.title,
        url: article.url,
        extract: "D&D 5e content from 5e.tools",
        content: "Item details not found in the data source.",
        isFullContent: false,
      };
    }

    // Parse the item based on its type
    let parsedData: ReturnType<typeof DnD5eToolsService.parseSpellForImport> | ReturnType<typeof DnD5eToolsService.parseMonsterForImport> | ReturnType<typeof DnD5eToolsService.parseMagicItemForImport> | import("../../../lib/services/dnd5e-tools").DnD5eRace | import("../../../lib/services/dnd5e-tools").DnD5eClass;
    let formattedContent = "";

    switch (contentType) {
      case "spell":
        parsedData = DnD5eToolsService.parseSpellForImport(item as import("../../../lib/services/dnd5e-tools").DnD5eSpell);
        formattedContent = formatSpellContent(parsedData);
        break;
      case "monster":
        parsedData = DnD5eToolsService.parseMonsterForImport(item as import("../../../lib/services/dnd5e-tools").DnD5eMonster);
        formattedContent = formatMonsterContent(parsedData);
        break;
      case "magic-item":
        parsedData = DnD5eToolsService.parseMagicItemForImport(item as import("../../../lib/services/dnd5e-tools").DnD5eItem);
        formattedContent = formatMagicItemContent(parsedData);
        break;
      case "race":
        formattedContent = formatRaceContent(item as import("../../../lib/services/dnd5e-tools").DnD5eRace);
        break;
      case "class":
        formattedContent = formatClassContent(item as import("../../../lib/services/dnd5e-tools").DnD5eClass);
        break;
    }

    return {
      id: article.id,
      title: article.title,
      url: article.url,
      extract: `D&D 5e ${contentType} from 5e.tools`,
      content: formattedContent,
      isFullContent: true,
    };
  } catch (error) {
    console.error("Error loading 5e.tools content:", error);
    return {
      id: article.id,
      title: article.title,
      url: article.url,
      extract: "D&D 5e content from 5e.tools",
      content: "Error loading detailed content.",
      isFullContent: false,
    };
  }
}

/**
 * Format spell content for display
 */
function formatSpellContent(spell: ReturnType<typeof DnD5eToolsService.parseSpellForImport>): string {
  return `## ${spell.name}

**Level:** ${spell.level}
**School:** ${spell.school}
**Casting Time:** ${spell.castingTime}
**Range:** ${spell.range}
**Duration:** ${spell.duration}
**Components:** ${spell.components}

${spell.description}`;
}

/**
 * Format monster content for display
 */
function formatMonsterContent(monster: ReturnType<typeof DnD5eToolsService.parseMonsterForImport>): string {
  return `## ${monster.name}

**Size:** ${monster.size}
**Type:** ${monster.type}
**Alignment:** ${monster.alignment}
**Armor Class:** ${monster.armorClass}
**Hit Points:** ${monster.hitPoints}
**Speed:** ${monster.speed}

### Stats
- **STR:** ${monster.stats.str}
- **DEX:** ${monster.stats.dex}
- **CON:** ${monster.stats.con}
- **INT:** ${monster.stats.int}
- **WIS:** ${monster.stats.wis}
- **CHA:** ${monster.stats.cha}

**Challenge Rating:** ${monster.challengeRating}

${monster.description}`;
}

/**
 * Format magic item content for display
 */
function formatMagicItemContent(item: ReturnType<typeof DnD5eToolsService.parseMagicItemForImport>): string {
  const attunement = item.requiresAttunement ? " (requires attunement)" : "";
  return `## ${item.name}

**Type:** ${item.type}
**Rarity:** ${item.rarity}${attunement}

${item.description}`;
}

/**
 * Format race content for display
 */
function formatRaceContent(race: import("../../../lib/services/dnd5e-tools").DnD5eRace): string {
  const size = typeof race.size === "string" ? race.size : "Unknown";
  const abilityText = race.ability ? formatAbilityScores(race.ability) : "";
  
  return `## ${race.name}

**Size:** ${size}
**Speed:** ${race.speed || "Unknown"} ft.

${abilityText}

${race.entries ? DnD5eToolsService.parseEntries(race.entries) : "No description available."}`;
}

/**
 * Format class content for display
 */
function formatClassContent(cls: import("../../../lib/services/dnd5e-tools").DnD5eClass): string {
  const hitDie = cls.hd ? `${cls.hd.number}d${cls.hd.faces}` : "Unknown";
  
  return `## ${cls.name}

**Hit Die:** ${hitDie}
**Proficiencies:** ${cls.proficiency ? cls.proficiency.join(", ") : "None"}

**Starting Equipment:** ${cls.startingEquipment || "Not specified"}`;
}

/**
 * Format ability score bonuses
 */
function formatAbilityScores(ability: import("../../../lib/services/dnd5e-tools").DnD5eRace["ability"]): string {
  if (!ability || !Array.isArray(ability)) return "";
  
  const bonuses = ability
    .map((bonus) => {
      const parts: string[] = [];
      if (bonus.str) parts.push(`STR +${bonus.str}`);
      if (bonus.dex) parts.push(`DEX +${bonus.dex}`);
      if (bonus.con) parts.push(`CON +${bonus.con}`);
      if (bonus.int) parts.push(`INT +${bonus.int}`);
      if (bonus.wis) parts.push(`WIS +${bonus.wis}`);
      if (bonus.cha) parts.push(`CHA +${bonus.cha}`);
      return parts.join(", ");
    })
    .filter(Boolean);
  
  return bonuses.length > 0 ? `**Ability Score Increases:** ${bonuses.join("; ")}` : "";
}
