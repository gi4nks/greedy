import React, { useState } from 'react';
import Page from '../components/Page';
import { WikiDataService, WikiArticle, WikiArticleDetails } from '../services/WikiDataService';
import { useCreateCharacter } from '../hooks/useCharacters';
import { useCreateMagicItem } from '../hooks/useMagicItems';
import { useCreateLocation } from '../hooks/useLocations';
import { useCreateParkingLotItem } from '../hooks/useParkingLot';
import {
  WikiFeedbackMessage,
  WikiSearchForm,
  WikiSearchResults,
  WikiInfoSection,
  WikiEmptyState,
  WikiLoadingState
} from '../components/wiki';

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
        <WikiFeedbackMessage
          message={feedbackMessage}
          onDismiss={() => setFeedbackMessage(null)}
        />

        {/* Search Section */}
        <WikiSearchForm
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          categories={categories}
          loading={loading}
          onSearchQueryChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onSearch={() => { void handleSearch(); }}
          onKeyPress={handleKeyPress}
        />

        {/* Results Section */}
        <WikiSearchResults
          searchResults={searchResults}
          expandedArticles={expandedArticles}
          fullContentArticles={fullContentArticles}
          onExpand={handleExpand}
          onShowDetails={handleShowDetails}
          onImport={handleImport}
          onShowRaw={(content) => setFeedbackMessage({ type: 'info', message: content })}
        />

        {/* Empty State */}
        <WikiEmptyState hasSearchQuery={!!searchQuery} />

        {/* Loading State */}
        <WikiLoadingState loading={loading} />

        {/* Info Section */}
        <WikiInfoSection />
      </div>
    </Page>
  );
}