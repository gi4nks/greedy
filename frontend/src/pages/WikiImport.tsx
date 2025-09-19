import React, { useState } from 'react';
import Page from '../components/Page';
import { WikiDataService, WikiArticle } from '../services/WikiDataService';

type ContentType = 'monster' | 'spell' | 'magic-item' | 'race' | 'class' | 'location' | 'note';

export default function WikiImport(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [fullContentArticles, setFullContentArticles] = useState<Map<number, any>>(new Map());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importContentType, setImportContentType] = useState<ContentType>('note');

  const categories = [
    { id: 'all', name: 'All Content', searchFn: null },
    { id: 'monsters', name: 'Monsters', searchFn: WikiDataService.searchMonsters },
    { id: 'spells', name: 'Spells', searchFn: WikiDataService.searchSpells },
    { id: 'magic-items', name: 'Magic Items', searchFn: WikiDataService.searchMagicItems },
    { id: 'races', name: 'Races', searchFn: WikiDataService.searchRaces },
    { id: 'classes', name: 'Classes', searchFn: WikiDataService.searchClasses },
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
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
        } catch (error) {
          console.error('Failed to load article details:', error);
          alert('Failed to load article details. Please try again.');
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
      
    } catch (error) {
      console.error('Failed to load full article content:', error);
      alert('Failed to load full article content. Please try again.');
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
      } catch (error) {
        console.error('Failed to load article details:', error);
        alert('Failed to load article details. Please try again.');
        return;
      } finally {
        setLoading(false);
      }
    }

    if (!articleDetail) {
      alert(`❌ Could not retrieve details for "${article.title}". The article might not exist or there might be an API issue.`);
      return;
    }

    // Auto-detect content type as suggestion
    const content = articleDetail.isFullContent ? articleDetail.content : articleDetail.extract;
    const suggestedType = detectContentType(article.title, content || '');

    // Show import dialog
    setSelectedArticle(article);
    setImportContentType(suggestedType as ContentType);
    setShowImportDialog(true);
  };

  const handleConfirmImport = async () => {
    if (!selectedArticle) return;

    try {
      setLoading(true);
      setShowImportDialog(false);

      console.log(`Starting import for article: ${selectedArticle.title} (ID: ${selectedArticle.id})`);

      // Get article details - fetch if not available
      let articleDetail = fullContentArticles.get(selectedArticle.id);
      if (!articleDetail) {
        console.log('Article details not cached, fetching...');
        const details = await WikiDataService.getArticleDetails([selectedArticle.id]);
        articleDetail = details[selectedArticle.id];
      }

      if (!articleDetail) {
        throw new Error(`Could not retrieve details for "${selectedArticle.title}". The article might not exist or there might be an API issue.`);
      }

      const content = articleDetail.isFullContent ? articleDetail.content : articleDetail.extract;

      console.log(`Importing as content type: ${importContentType}`);

      switch (importContentType) {
        case 'monster':
          await importMonster(selectedArticle, content);
          break;
        case 'spell':
          await importSpell(selectedArticle, content);
          break;
        case 'magic-item':
          await importMagicItem(selectedArticle, content);
          break;
        case 'race':
          await importRace(selectedArticle, content);
          break;
        case 'class':
          await importClass(selectedArticle, content);
          break;
        case 'location':
          await importLocation(selectedArticle, content);
          break;
        default:
          // For unknown types, create a generic note
          await importGenericNote(selectedArticle, content);
      }

    } catch (error: any) {
      console.error('Import failed for article', selectedArticle.id, ':', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to import data. Please try again.';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `❌ Article "${selectedArticle.title}" not found on the wiki.`;
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

      alert(errorMessage);
    } finally {
      setLoading(false);
      setSelectedArticle(null);
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
  const detectContentType = (title: string, content: string): string => {
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

    return 'generic';
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
      // Store monster combat stats
      armor_class: parsedData.armorClass || 10,
      hit_dice: parsedData.hitDice || '1d8',
      movement: parsedData.movement || '30 ft.',
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as character with role="Monster"
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monsterData)
    });

    if (response.ok) {
      alert(`✅ Monster "${article.title}" imported successfully to Characters section!`);
    } else {
      throw new Error('Failed to import monster');
    }
  };

  const importSpell = async (article: WikiArticle, content: string) => {
    const parsedData = WikiDataService.parseSpellData(content);

    const spellData = {
      adventure_id: null,
      name: article.title,
      role: 'Spell',
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      tags: ['spell', 'wiki-import'],
      // Store spell details in spells field as JSON
      spells: [{
        name: article.title,
        level: parsedData.level,
        range: parsedData.range,
        duration: parsedData.duration,
        description: content,
        source: 'AD&D 2nd Edition Wiki'
      }],
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as character with role="Spell"
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spellData)
    });

    if (response.ok) {
      alert(`✅ Spell "${article.title}" imported successfully as a character entry!`);
    } else {
      throw new Error('Failed to import spell');
    }
  };

    const importMagicItem = async (article: WikiArticle, content: string) => {
    const parsedData = WikiDataService.parseMagicItemData(content);

    const itemData = {
      name: article.title,
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      rarity: parsedData.rarity,
      type: parsedData.type,
      tags: ['magic-item', 'wiki-import'],
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as magic item using dedicated endpoint
    const response = await fetch('/api/magic-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });

    if (response.ok) {
      alert(`✅ Magic Item "${article.title}" imported successfully to Magic Items section!`);
    } else {
      throw new Error('Failed to import magic item');
    }
  };

  const importRace = async (article: WikiArticle, content: string) => {
    const raceData = {
      adventure_id: null,
      name: article.title,
      role: 'Race',
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      tags: ['race', 'wiki-import'],
      race: article.title, // Store race name in race field
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as character with role="Race"
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(raceData)
    });

    if (response.ok) {
      alert(`✅ Race "${article.title}" imported successfully to Characters section!`);
    } else {
      throw new Error('Failed to import race');
    }
  };

  const importClass = async (article: WikiArticle, content: string) => {
    const classData = {
      adventure_id: null,
      name: article.title,
      role: 'Class',
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      tags: ['class', 'wiki-import'],
      class: article.title, // Store class name in class field
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as character with role="Class"
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData)
    });

    if (response.ok) {
      alert(`✅ Class "${article.title}" imported successfully to Characters section!`);
    } else {
      throw new Error('Failed to import class');
    }
  };

  const importLocation = async (article: WikiArticle, content: string) => {
    const locationData = {
      adventure_id: null,
      name: article.title,
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      notes: 'Location imported from wiki',
      tags: ['location', 'wiki-import'],
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    const response = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });

    if (response.ok) {
      alert(`✅ Location "${article.title}" imported successfully to Locations section!`);
    } else {
      throw new Error('Failed to import location');
    }
  };

  const importGenericNote = async (article: WikiArticle, content: string) => {
    const noteData = {
      adventure_id: null,
      name: article.title,
      description: content || 'Imported from AD&D 2nd Edition Wiki',
      notes: 'Generic wiki article imported',
      tags: ['wiki-import'],
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as location (generic articles stored as locations)
    const response = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      alert(`✅ Article "${article.title}" imported successfully to Locations section!`);
    } else {
      throw new Error('Failed to import article');
    }
  };

  return (
    <Page title="Wiki Import">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Search AD&D 2nd Edition Wiki</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter search terms..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {getCategoryIcon(category.id)} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Search the official AD&D 2nd Edition wiki for monsters, spells, magic items, races, classes, and more.
              Import data directly into your campaign or reference official game content.
            </p>
          </div>
        </div>

        {/* Results Section */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Search Results ({searchResults.length})
            </h3>

            <div className="grid gap-4">
              {searchResults.map((article) => {
                const isExpanded = expandedArticles.has(article.id);
                const articleData = fullContentArticles.get(article.id);
                
                return (
                  <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleExpand(article)}
                            className="w-8 h-8 border-2 border-gray-200 rounded-full bg-gray-50 flex items-center justify-center text-sm hover:bg-gray-100 flex-shrink-0 mt-1"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? '-' : '+'}
                          </button>

                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                              {article.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {WikiDataService.getFullUrl(article.url)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>📖 Wiki Article</span>
                              <span>•</span>
                              <span>ID: {article.id}</span>
                            </div>
      </div>
    </div>

    {/* Import Dialog */}
    {showImportDialog && selectedArticle && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Import Article</h3>
          <p className="text-gray-600 mb-4">
            Import "{selectedArticle.title}" as:
          </p>

          <div className="space-y-2 mb-6">
            <label className="flex items-center">
              <input
                type="radio"
                value="monster"
                checked={importContentType === 'monster'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Monster/NPC
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="spell"
                checked={importContentType === 'spell'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Spell
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="magic-item"
                checked={importContentType === 'magic-item'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Magic Item
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="race"
                checked={importContentType === 'race'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Race
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="class"
                checked={importContentType === 'class'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Class
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="location"
                checked={importContentType === 'location'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Location
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="note"
                checked={importContentType === 'note'}
                onChange={(e) => setImportContentType(e.target.value as ContentType)}
                className="mr-2"
              />
              Generic Note
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowImportDialog(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleShowDetails(article)}
                          className="px-3 py-1 text-purple-600 hover:text-purple-800 text-sm font-medium border border-purple-200 rounded hover:bg-purple-50"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => window.open(WikiDataService.getFullUrl(article.url), '_blank')}
                          className="px-3 py-1 text-green-600 hover:text-green-800 text-sm font-medium border border-green-200 rounded hover:bg-green-50"
                        >
                          View on Wiki
                        </button>
                        <button
                          onClick={() => handleImport(article)}
                          className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                        >
                          Import Data
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && articleData && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <h5 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <span className="text-blue-600">📖</span>
                                {articleData.isFullContent ? 'Full Article Content' : 'Article Summary'}
                              </h5>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                articleData.isFullContent 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {articleData.isFullContent ? 'Full' : 'Summary'}
                              </span>
                              <button
                                onClick={() => {
                                  const contentToShow = articleData.isFullContent ? articleData.content : articleData.extract;
                                  console.log('=== ARTICLE CONTENT ===');
                                  console.log('Article:', article.title);
                                  console.log('Raw content:', contentToShow);
                                }}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 ml-2"
                              >
                                Debug
                              </button>
                              <button
                                onClick={() => {
                                  const contentToShow = articleData.isFullContent ? articleData.content : articleData.extract;
                                  alert('Raw Content:\n\n' + (contentToShow || 'No content'));
                                }}
                                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 ml-2"
                              >
                                Raw
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-6 max-h-[600px] overflow-y-auto">
                            <div className="fandom-content">
                              {(() => {
                                const contentToShow = articleData.isFullContent ? articleData.content : articleData.extract;

                                if (articleData.isFullContent && contentToShow) {
                                  // Render full content as HTML with Fandom styling
                                  const htmlContent = WikiDataService.wikitextToHtml(contentToShow);
                                  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
                                } else {
                                  // Render extract as plain text with basic formatting
                                  return <div className="whitespace-pre-wrap leading-relaxed text-gray-700">{contentToShow || 'No content available'}</div>;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !loading && searchQuery && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or selecting a different category.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching the AD&D wiki...</p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ About Wiki Integration</h3>
          <div className="text-blue-800 space-y-2">
            <p>
              <strong>Data Source:</strong> Official AD&D 2nd Edition Wiki on Fandom
            </p>
            <p>
              <strong>Import Destinations:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Spells</strong> → Characters section (as spell entries)</li>
              <li><strong>Magic Items</strong> → Magic Items section</li>
              <li><strong>Monsters</strong> → Characters section (as monster entries)</li>
              <li><strong>Races</strong> → Characters section (as race entries)</li>
              <li><strong>Classes</strong> → Characters section (as class entries)</li>
              <li><strong>Other Content</strong> → Locations section</li>
            </ul>
            <p>
              <strong>Note:</strong> Always verify imported data against your campaign's house rules
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}