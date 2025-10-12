'use client';

import { useState, useEffect } from 'react';
import { WikiDataService, WikiArticle, WikiArticleDetails } from '../../../lib/services/wiki-data';
import { EditionAwareImportService, GameEdition } from '../../../lib/services/edition-aware-import';
import { Campaign } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';
import { WikiItemAssignmentDialog } from '@/components/wiki/WikiItemAssignmentDialog';
import { detectWikiItemCategory, getCategoryDisplayInfo } from '@/lib/utils/wiki-categories';
import { Search, BookOpen, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface FeedbackMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function WikiImport() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<WikiArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [fullContentArticles, setFullContentArticles] = useState<Map<number, WikiArticleDetails>>(new Map());
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  
  // Edition-aware state
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [gameEdition, setGameEdition] = useState<GameEdition>('dnd5e');

  // Load campaigns on component mount
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        // Use getCampaigns to get campaigns with game edition info
        const response = await fetch('/api/campaigns/with-editions');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        } else {
          // Fallback to regular campaigns endpoint
          const fallbackResponse = await fetch('/api/campaigns');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setCampaigns(fallbackData);
          }
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      }
    };
    
    loadCampaigns();
  }, []);

  // Detect campaign edition when campaign is selected
  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign) {
        const detectedEdition = EditionAwareImportService.detectGameEdition(
          campaign.gameEditionName || campaign.gameEditionVersion || undefined
        );
        setGameEdition(detectedEdition);
      }
    }
  }, [selectedCampaignId, campaigns]);

  // Get available categories for current edition
  const availableCategories = EditionAwareImportService.getCategoriesForEdition(gameEdition);
  
  // Legacy categories for backward compatibility
  const categories = [
    { id: 'all', name: 'All Content' },
    { id: 'monsters', name: 'Monsters' },
    { id: 'spells', name: 'Spells' },
    { id: 'magic-items', name: 'Magic Items' },
    { id: 'races', name: 'Races' },
    { id: 'classes', name: 'Classes' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!selectedCampaignId) {
      setFeedbackMessage({ type: 'error', message: 'Please select a campaign first' });
      return;
    }

    setLoading(true);
    try {
      // Use EditionAwareImportService for unified search
      const results: WikiArticle[] = await EditionAwareImportService.search(
        selectedCategory,
        searchQuery,
        selectedCampaignId
      );

      setSearchResults(results);
      setFeedbackMessage(null);
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during search';
      setFeedbackMessage({ type: 'error', message: errorMessage });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  };

  const handleExpand = async (article: WikiArticle) => {
    setExpandedArticles(prev => {
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
    if (!fullContentArticles.has(article.id) && !expandedArticles.has(article.id)) {
      try {
        if (article.id >= 5000000) {
          // This is a 5e.tools article, handle differently
          // For now, just show basic info
          setFullContentArticles(prev => new Map(prev).set(article.id, {
            id: article.id,
            title: article.title,
            url: article.url,
            extract: 'D&D 5e content from 5e.tools',
            content: 'Detailed content loading not implemented yet for 5e.tools data.',
            isFullContent: false
          }));
        } else {
          // AD&D 2e wiki article
          const articleDetail = await WikiDataService.getArticleFullContent(article);
          setFullContentArticles(prev => new Map(prev).set(article.id, articleDetail));
        }
      } catch (error) {
        console.error('Error loading article details:', error);
        setExpandedArticles(prev => new Set(prev).add(article.id));
      }
    } else if (!expandedArticles.has(article.id)) {
      const fullContent = fullContentArticles.get(article.id);
      if (fullContent) {
        setFullContentArticles(prev => new Map(prev).set(article.id, fullContent));
      }
      setExpandedArticles(prev => new Set(prev).add(article.id));
    }
  };

  const renderArticleContent = (article: WikiArticle): string => {
    const details = fullContentArticles.get(article.id);
    if (details?.content) {
      return WikiDataService.wikitextToHtml(details.content);
    } else if (details?.extract) {
      return details.extract;
    }
    return 'Loading content...';
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: 'Wiki Import' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wiki Import</h1>
        <p className="text-base-content/70">
          Import content from various D&D sources based on your campaign edition
        </p>
      </div>

      <div className="space-y-6">
        {feedbackMessage && (
          <div className={`alert ${
            feedbackMessage.type === 'success' 
              ? 'alert-success' 
              : feedbackMessage.type === 'error'
              ? 'alert-error'
              : 'alert-info'
          }`}>
            {feedbackMessage.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {feedbackMessage.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {feedbackMessage.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
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
                name='campaign-select'
                value={selectedCampaignId?.toString() || ''}
                onValueChange={(value) => setSelectedCampaignId(value ? Number(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.title} ({campaign.gameEditionName || campaign.gameEditionVersion || 'Unknown Edition'})
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
                <span className="font-medium">Available Content Types:</span>{' '}
                {availableCategories.map(cat => cat.name).join(', ')}
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
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
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
              >
                {loading ? 'Searching...' : 'Search'}
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
                const category = detectWikiItemCategory(article.title, fullArticle?.content);
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
                                {article.id >= 5000000 ? 'D&D 5e (5e.tools)' : 'AD&D 2e (Fandom Wiki)'}
                              </Badge>
                              <Badge className={`${categoryInfo.color} text-white`}>
                                {categoryInfo.icon} {categoryInfo.label}
                              </Badge>
                            </div>
                          </div>
                          {expandedArticles.has(article.id) ? 
                            <ChevronDown className="w-5 h-5 text-base-content/70" /> : 
                            <ChevronRight className="w-5 h-5 text-base-content/70" />
                          }
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
                                const fullContent = fullContentArticles.get(article.id);
                                let parsedData = {};

                                // Parse the content based on category
                                if (fullContent?.content) {
                                  if (category === 'spell') {
                                    parsedData = WikiDataService.parseSpellData(fullContent.content);
                                  } else if (category === 'monster') {
                                    parsedData = WikiDataService.parseMonsterData(fullContent.content);
                                  } else if (category === 'magic-item') {
                                    parsedData = WikiDataService.parseMagicItemData(fullContent.content);
                                  }
                                }

                                // First, create or find the wiki article in our database
                                const articleResponse = await fetch('/api/wiki-articles', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    title: article.title,
                                    contentType: category,
                                    wikiUrl: article.id >= 5000000 ? article.url : `https://adnd2e.fandom.com${article.url}`,
                                    rawContent: fullContent?.content || '',
                                    parsedData: parsedData,
                                    importedFrom: article.id >= 5000000 ? 'dnd5e-tools' : 'adnd2e-wiki',
                                  }),
                                });

                                if (!articleResponse.ok) {
                                  throw new Error('Failed to create wiki article');
                                }

                                const createdArticle = await articleResponse.json();

                                // Then create the entity relationship
                                const relationshipResponse = await fetch(`/api/wiki-articles/${createdArticle.id}/entities`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    entityType: assignment.entityType,
                                    entityId: assignment.entityId,
                                    relationshipType: 'referenced',
                                    relationshipData: assignment.notes ? { notes: assignment.notes } : {},
                                  }),
                                });

                                if (!relationshipResponse.ok) {
                                  throw new Error('Failed to create entity relationship');
                                }

                                setFeedbackMessage({
                                  type: 'success',
                                  message: `Successfully assigned "${article.title}" to ${assignment.entityType} "${assignment.entityName}"`
                                });
                              } catch (error) {
                                console.error('Assignment error:', error);
                                setFeedbackMessage({
                                  type: 'error',
                                  message: `Failed to assign "${article.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
                          <MarkdownRenderer
                            content={renderArticleContent(article)}
                            className="prose-sm"
                            allowHtml
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
                No results found for &quot;{searchQuery}&quot;. Try a different search term or category.
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
      </div>
    </div>
  );
}