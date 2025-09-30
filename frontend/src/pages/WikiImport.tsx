import React, { useState } from 'react';
import Page from '../components/Page';
import { WikiDataService, WikiArticle, WikiArticleDetails } from '../services/WikiDataService';
import { useCreateCharacter } from '../hooks/useCharacters';
import { useCreateMagicItem } from '../hooks/useMagicItems';
import { useCreateLocation } from '../hooks/useLocations';
import { useCreateParkingLotItem } from '../hooks/useParkingLot';

type ContentType = 'monster' | 'spell' | 'magic-item' | 'race' | 'class' | 'location' | 'note' | 'parking-lot';

export default function WikiImport(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [fullContentArticles, setFullContentArticles] = useState<Map<number, WikiArticleDetails>>(new Map());
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info', message: string } | null>(null);

  // React Query mutations
  const createCharacterMutation = useCreateCharacter();
  const createMagicItemMutation = useCreateMagicItem();
  const createLocationMutation = useCreateLocation();
  const createParkingLotItemMutation = useCreateParkingLotItem();

  const categories = [
    { id: 'all', name: 'All Content', searchFn: null },
    { id: 'monsters', name: 'Monsters', searchFn: () => WikiDataService.searchMonsters() },
    { id: 'spells', name: 'Spells', searchFn: () => WikiDataService.searchSpells() },
    { id: 'magic-items', name: 'Magic Items', searchFn: () => WikiDataService.searchMagicItems() },
    { id: 'races', name: 'Races', searchFn: () => WikiDataService.searchRaces() },
    { id: 'classes', name: 'Classes', searchFn: () => WikiDataService.searchClasses() },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let results: WikiArticle[];

      if (selectedCategory === 'all') {
        results = await WikiDataService.searchArticles(searchQuery);
      } else {
        const category = categories.find(cat => cat.id === selectedCategory);
        if (category?.searchFn) {
          results = await category.searchFn();
          // Filter results by search query if provided
          if (searchQuery.trim()) {
            results = results.filter(article =>
              article.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
        } else {
          results = [];
        }
      }

      setSearchResults(results);
    } catch {
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
    if (expandedArticles.has(article.id)) {
      // Collapse
      setExpandedArticles(prev => {
        const newSet = new Set(prev);
        newSet.delete(article.id);
        return newSet;
      });
    } else {
      // Expand - get article details if not already loaded
      if (!fullContentArticles.has(article.id)) {
        try {
          setLoading(true);
          const details = await WikiDataService.getArticleDetails([article.id]);
          const articleDetail = details[article.id];
          if (articleDetail) {
            setFullContentArticles(prev => new Map(prev).set(article.id, articleDetail));
          }
        } catch {
          setFeedbackMessage({ type: 'error', message: 'Failed to load article details. Please try again.' });
          return;
        } finally {
          setLoading(false);
        }
      }

      // Expand the article
      setExpandedArticles(prev => new Set(prev).add(article.id));
    }
  };

  const handleShowDetails = async (article: WikiArticle) => {
    try {
      setLoading(true);

      // Get full content
      const fullContent = await WikiDataService.getArticleFullContent(article.id);
      setFullContentArticles(prev => new Map(prev).set(article.id, fullContent));

      // Also expand to show the content
      setExpandedArticles(prev => new Set(prev).add(article.id));

    } catch {
      setFeedbackMessage({ type: 'error', message: 'Failed to load full article content. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (article: WikiArticle) => {
    // Get article content first
    let articleDetail = fullContentArticles.get(article.id);
    if (!articleDetail) {
      try {
        setLoading(true);
        const details = await WikiDataService.getArticleDetails([article.id]);
        articleDetail = details[article.id];
      } catch {
        setFeedbackMessage({ type: 'error', message: 'Failed to load article details. Please try again.' });
        return;
      } finally {
        setLoading(false);
      }
    }

    if (!articleDetail) {
      setFeedbackMessage({ type: 'error', message: `Could not retrieve details for "${article.title}". The article might not exist or there might be an API issue.` });
      return;
    }

    // Auto-detect content type
    const content = (articleDetail.isFullContent ? articleDetail.content : articleDetail.extract) || '';
    const detectedType = detectContentType(article.title, content);

    // Import automatically based on detected type
    try {
      setLoading(true);

      switch (detectedType) {
        case 'monster':
          await importMonster(article, content);
          break;
        case 'spell':
          await importSpell(article, content);
          break;
        case 'magic-item':
          await importMagicItem(article, content);
          break;
        case 'race':
          await importToParkingLot(article, content, 'race');
          break;
        case 'class':
          await importToParkingLot(article, content, 'class');
          break;
        case 'location':
          await importLocation(article, content);
          break;
        default:
          // For unknown types, send to parking lot
          await importToParkingLot(article, content, 'generic');
      }

    } catch (error: any) {

      // Provide more specific error messages
      let errorMessage = 'Failed to import data. Please try again.';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `❌ Article "${article.title}" not found on the wiki.`;
        } else if (error.response.status === 408) {
          errorMessage = `❌ Request timed out. Please try again.`;
        } else if (error.response.status >= 500) {
          errorMessage = `❌ Wiki server error. Please try again later.`;
        } else {
          errorMessage = `❌ Import failed: ${error.response.data?.error || error.message}`;
        }
      } else if (error.message) {
        errorMessage = `❌ Import failed: ${error.message}`;
      }

      setFeedbackMessage({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'monsters': return '👹';
      case 'spells': return '✨';
      case 'magic-items': return '💍';
      case 'races': return '👥';
      case 'classes': return '⚔️';
      default: return '📚';
    }
  };

  // Content type detection - improved logic
  const detectContentType = (title: string, content: string): ContentType => {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Check for magic items - more flexible detection
    const magicItemKeywords = ['ring', 'amulet', 'cloak', 'boots', 'belt', 'helmet', 'armor', 'shield', 'sword', 'dagger', 'wand', 'staff', 'rod', 'potion', 'scroll', 'tome', 'book', 'crown', 'gauntlets', 'bracers'];
    const hasMagicItemKeyword = magicItemKeywords.some(keyword => lowerTitle.includes(keyword));
    if (hasMagicItemKeyword || lowerTitle.includes('magic') || lowerContent.includes('rarity:') || lowerContent.includes('type:')) {
      return 'magic-item';
    }

    // Check title patterns first
    if (lowerTitle.includes('spell') || lowerContent.includes('level:') || lowerContent.includes('range:') || lowerContent.includes('duration:')) {
      return 'spell';
    }
    if (lowerTitle.includes('monster') || lowerContent.includes('hit dice') || lowerContent.includes('armor class') || lowerContent.includes('movement:')) {
      return 'monster';
    }
    if (lowerTitle.includes('race') || lowerTitle.includes('species') || lowerContent.includes('ability score') || lowerContent.includes('racial traits')) {
      return 'race';
    }
    if (lowerTitle.includes('class') || lowerContent.includes('hit die') || lowerContent.includes('weapon proficiency') || lowerContent.includes('non-weapon proficiency')) {
      return 'class';
    }
    if (lowerTitle.includes('location') || lowerTitle.includes('place') || lowerTitle.includes('city') || lowerTitle.includes('town') || lowerTitle.includes('castle') || lowerTitle.includes('dungeon')) {
      return 'location';
    }

    return 'note';
  };

  // Import functions for different content types
  const importMonster = async (article: WikiArticle, content: string) => {
    const parsedData = WikiDataService.parseMonsterData(content);

    const monsterData = {
      adventure_id: null,
      name: article.title,
      role: 'Monster',
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      tags: ['monster', 'wiki-import'],
      // Required Character fields with defaults
      level: 1,
      experience: 0,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      hitPoints: 10,
      maxHitPoints: 10,
      armorClass: parsedData.armorClass || 10,
      initiative: 0,
      speed: 30,
      proficiencyBonus: 2,
      // Store monster combat stats in description and legacy fields
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as character with role="Monster"
    await createCharacterMutation.mutateAsync(monsterData);
    setFeedbackMessage({ type: 'success', message: `Monster "${article.title}" imported successfully to Characters section!` });
  };

  const importSpell = async (article: WikiArticle, content: string) => {
    const parsedData = WikiDataService.parseSpellData(content);

    const spellData = {
      adventure_id: null,
      name: article.title,
      role: 'Spell',
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      tags: ['spell', 'wiki-import'],
      // Required Character fields with defaults
      level: 1,
      experience: 0,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      hitPoints: 10,
      maxHitPoints: 10,
      armorClass: 10,
      initiative: 0,
      speed: 30,
      proficiencyBonus: 2,
      // Store spell details in spells field as JSON
      spells: [{
        level: (typeof parsedData.level === 'number' && parsedData.level >= 0 && parsedData.level <= 9) ? parsedData.level as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 : 1,
        name: article.title,
        prepared: true
      }],
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as character with role="Spell"
    await createCharacterMutation.mutateAsync(spellData);
    setFeedbackMessage({ type: 'success', message: `Spell "${article.title}" imported successfully as a character entry!` });
  };

  const importMagicItem = async (article: WikiArticle, content: string) => {
    const parsedData = WikiDataService.parseMagicItemData(content);

    const itemData = {
      name: article.title,
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      rarity: parsedData.rarity,
      type: parsedData.type,
      tags: ['magic-item', 'wiki-import'],
      attunement_required: false,
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as magic item using dedicated endpoint
    await createMagicItemMutation.mutateAsync(itemData);
    setFeedbackMessage({ type: 'success', message: `Magic Item "${article.title}" imported successfully to Magic Items section!` });
  };

  const importLocation = async (article: WikiArticle, content: string) => {
    const locationData = {
      adventure_id: undefined,
      name: article.title,
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      notes: 'Location imported from wiki',
      tags: ['location', 'wiki-import']
    };

    await createLocationMutation.mutateAsync(locationData);
    setFeedbackMessage({ type: 'success', message: `Location "${article.title}" imported successfully to Locations section!` });
  };

  const importToParkingLot = async (article: WikiArticle, content: string, contentType: string) => {
    const parkingLotData = {
      name: article.title,
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      content_type: contentType,
      wiki_url: WikiDataService.getFullUrl(article.url),
      tags: ['wiki-import', contentType]
    };

    await createParkingLotItemMutation.mutateAsync(parkingLotData);
    setFeedbackMessage({ type: 'success', message: `"${article.title}" (${contentType}) added to Parking Lot for future organization!` });
  };

  return (
    <Page title="Wiki Import">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Feedback Messages */}
        {feedbackMessage && (
          <div className={`alert ${feedbackMessage.type === 'success' ? 'alert-success' : feedbackMessage.type === 'error' ? 'alert-error' : feedbackMessage.type === 'warning' ? 'alert-warning' : 'alert-info'}`}>
            <div>
              <span>{feedbackMessage.message}</span>
            </div>
            <div>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl">Search AD&D 2nd Edition Wiki</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="search-query" className="block text-sm font-medium text-base-content mb-2">Search Query</label>
                  <input
                    id="search-query"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter search terms..."
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label htmlFor="category-select" className="block text-sm font-medium text-base-content mb-2">Category</label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {getCategoryIcon(category.id)} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="search-button" className="block text-sm font-medium text-base-content mb-2 opacity-0">Search</label>
                  <button
                    id="search-button"
                    onClick={() => void handleSearch()}
                    disabled={loading}
                    className={`btn btn-primary btn-sm w-full ${loading ? 'loading' : ''}`}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              <div className="text-sm text-base-content/70 bg-base-200 p-4 rounded-box">
                <p>
                  Search the official AD&D 2nd Edition wiki for monsters, spells, magic items, races, classes, and more.
                  Content is automatically imported to the appropriate section or parking lot.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {searchResults.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg">
                Search Results ({searchResults.length})
              </h3>

              <div className="space-y-4">
                {searchResults.map((article) => {
                  const isExpanded = expandedArticles.has(article.id);
                  const articleData = fullContentArticles.get(article.id);

                  return (
                    <div key={article.id} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => void handleExpand(article)}
                                className="btn btn-outline btn-primary btn-sm"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? '−' : '+'}
                              </button>

                              <div className="flex-1">
                                <h4 className="card-title text-lg mb-2">
                                  {article.title}
                                </h4>
                                <p className="text-sm text-base-content/70 mb-2">
                                  {WikiDataService.getFullUrl(article.url)}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-base-content/50">
                                  <span>📖 Wiki Article</span>
                                  <span>•</span>
                                  <span>ID: {article.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => void handleShowDetails(article)}
                              className="btn btn-secondary btn-sm"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => window.open(WikiDataService.getFullUrl(article.url), '_blank')}
                              className="btn btn-success btn-sm"
                            >
                              View on Wiki
                            </button>
                            <button
                              onClick={() => void handleImport(article)}
                              className="btn btn-primary btn-sm"
                            >
                              Import
                            </button>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && articleData && (
                          <div className="mt-6 pt-6 border-t border-base-300">
                            <div className="card bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm">
                              <div className="card-body">
                                <div className="flex items-center justify-between">
                                  <h5 className="card-title text-lg flex items-center gap-2">
                                    <span className="text-primary">📖</span>
                                    {articleData.isFullContent ? 'Full Article Content' : 'Article Summary'}
                                  </h5>
                                  <div className="badge badge-primary">
                                    {articleData.isFullContent ? 'Full' : 'Summary'}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const contentToShow = articleData.isFullContent ? articleData.content : articleData.extract;
                                      setFeedbackMessage({ type: 'info', message: `Raw Content:\n\n${contentToShow || 'No content'}` });
                                    }}
                                    className="btn btn-secondary btn-xs"
                                  >
                                    Raw
                                  </button>
                                </div>

                                <div className="max-h-[600px] overflow-y-auto">
                                  <div className="prose prose-sm max-w-none">
                                    {(() => {
                                      const contentToShow = articleData.isFullContent ? articleData.content : articleData.extract;

                                      if (articleData.isFullContent && contentToShow) {
                                        // Render full content as HTML with Fandom styling
                                        const htmlContent = WikiDataService.wikitextToHtml(contentToShow);
                                        return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
                                      } else {
                                        // Render extract as plain text with basic formatting
                                        return <div className="whitespace-pre-wrap leading-relaxed text-base-content/80">{contentToShow || 'No content available'}</div>;
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !loading && searchQuery && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="card-title text-lg mb-2">No results found</h3>
              <p className="text-base-content/70">
                Try adjusting your search terms or selecting a different category.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <span className="loading loading-spinner loading-lg mx-auto mb-4"></span>
              <p className="text-base-content/70">Searching the AD&D wiki...</p>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="alert alert-info">
          <div>
            <h3 className="font-bold text-lg">ℹ️ About Automatic Wiki Import</h3>
            <div className="space-y-2 mt-2">
              <p>
                <strong>Data Source:</strong> Official AD&D 2nd Edition Wiki on Fandom
              </p>
              <p>
                <strong>Automatic Import Destinations:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Monsters</strong> → Characters section (as monster entries)</li>
                <li><strong>Spells</strong> → Characters section (as spell entries)</li>
                <li><strong>Magic Items</strong> → Magic Items section</li>
                <li><strong>Locations</strong> → Locations section</li>
                <li><strong>Races & Classes</strong> → Parking Lot (for future organization)</li>
                <li><strong>Other Content</strong> → Parking Lot</li>
              </ul>
              <p>
                <strong>Note:</strong> Content is automatically categorized. Check the Parking Lot for items that need manual organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}