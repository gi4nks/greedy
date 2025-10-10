import React, { useState, useEffect } from 'react';
import Page from '../components/Page';
import { WikiDataService, WikiArticle, WikiArticleDetails } from '../services/WikiDataService';
import { EditionAwareImportService, GameEdition, ImportCategory } from '../services/EditionAwareImportService';
import { useCreateCharacter } from '../hooks/useCharacters';
import { useCreateMagicItem } from '../hooks/useMagicItems';
import { useCreateLocation } from '../hooks/useLocations';
import { useCreateParkingLotItem } from '../hooks/useParkingLot';
import { useCampaigns } from '../hooks/useCampaigns';
import {
  WikiFeedbackMessage,
  WikiSearchForm,
  WikiSearchResults,
  WikiInfoSection,
  WikiEmptyState,
  WikiLoadingState
} from '../components/wiki';
import CharacterAssignmentModal from '../components/magicItem/CharacterAssignmentModal';
import { useCharacters } from '../hooks/useCharacters';
import { useAssignMagicItem } from '../hooks/useMagicItems';

type ContentType = 'monster' | 'spell' | 'magic-item' | 'race' | 'class' | 'location' | 'note' | 'parking-lot';

export default function WikiImport(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [gameEdition, setGameEdition] = useState<GameEdition>('dnd5e');
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [fullContentArticles, setFullContentArticles] = useState<Map<number, WikiArticleDetails>>(new Map());
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info', message: string } | null>(null);
  const [assignmentModalItem, setAssignmentModalItem] = useState<{ id: number; name: string; type: 'magic-item' | 'spell' | 'monster' } | null>(null);
  const [assigning, setAssigning] = useState(false);

  // React Query mutations
  const createCharacterMutation = useCreateCharacter();
  const createMagicItemMutation = useCreateMagicItem();
  const createLocationMutation = useCreateLocation();
  const createParkingLotItemMutation = useCreateParkingLotItem();
  const assignMutation = useAssignMagicItem();

  // Wiki entity creation functions
  const createWikiArticle = async (articleData: any) => {
    const response = await fetch('/api/wiki-articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleData)
    });
    if (!response.ok) throw new Error('Failed to create wiki article');
    return response.json();
  };

  const createWikiArticleRelationship = async (articleId: number, entityType: string, entityId: number, relationshipType: string, relationshipData?: any) => {
    const response = await fetch(`/api/wiki-articles/${articleId}/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType,
        entityId,
        relationshipType,
        relationshipData
      })
    });
    if (!response.ok) throw new Error('Failed to create wiki article relationship');
    return response.json();
  };
  
  // Campaign data
  const { data: campaigns = [] } = useCampaigns();
  const { data: characters = [] } = useCharacters();

  // Detect campaign edition when campaign is selected
  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign) {
        const detectedEdition = EditionAwareImportService.detectGameEdition(
          campaign.gameEditionName || campaign.gameEditionVersion
        );
        setGameEdition(detectedEdition);
      }
    }
  }, [selectedCampaignId, campaigns]);

  // Get available categories for current edition
  const availableCategories = EditionAwareImportService.getCategoriesForEdition(gameEdition);
  
  // Legacy categories for backward compatibility
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
    
    if (!selectedCampaignId) {
      setFeedbackMessage({ type: 'error', message: 'Please select a campaign first' });
      return;
    }

    setLoading(true);
    try {
      let results: WikiArticle[];

      // Use EditionAwareImportService for unified search
      results = await EditionAwareImportService.search(
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

    const articleData = {
      title: article.title,
      contentType: 'monster',
      wikiUrl: WikiDataService.getFullUrl(article.url),
      rawContent: content,
      parsedData: {
        type: 'Monster',
        challengeRating: '1',
        armorClass: parsedData.armorClass || 10,
        hitPoints: 10,
        speed: '30 ft',
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        description: content || 'Imported from AD&D 2nd Edition Wiki'
      },
      importedFrom: 'wiki'
    };

    // Create wiki article
    const createdArticle = await createWikiArticle(articleData);
    setFeedbackMessage({ type: 'success', message: `Monster "${article.title}" imported successfully! You can now assign it to characters.` });

    // Open assignment modal for the newly created article
    if (createdArticle && createdArticle.id) {
      setAssignmentModalItem({ id: createdArticle.id, name: createdArticle.title, type: 'monster' });
    }
  };

  const importSpell = async (article: WikiArticle, content: string) => {
    const parsedData = WikiDataService.parseSpellData(content);

    const articleData = {
      title: article.title,
      contentType: 'spell',
      wikiUrl: WikiDataService.getFullUrl(article.url),
      rawContent: content,
      parsedData: {
        level: parsedData.level || 1,
        school: 'Evocation',
        range: parsedData.range || 'Touch',
        duration: parsedData.duration || 'Instantaneous',
        castingTime: '1 action',
        components: 'V, S',
        description: content || 'Imported from AD&D 2nd Edition Wiki'
      },
      importedFrom: 'wiki'
    };

    // Create wiki article
    const createdArticle = await createWikiArticle(articleData);
    setFeedbackMessage({ type: 'success', message: `Spell "${article.title}" imported successfully! You can now assign it to characters.` });

    // Open assignment modal for the newly created article
    if (createdArticle && createdArticle.id) {
      setAssignmentModalItem({ id: createdArticle.id, name: createdArticle.title, type: 'spell' });
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
      attunement_required: false,
      wiki_url: WikiDataService.getFullUrl(article.url)
    };

    // Import as magic item using dedicated endpoint
    const createdItem = await createMagicItemMutation.mutateAsync(itemData);
    setFeedbackMessage({ type: 'success', message: `Magic Item "${article.title}" imported successfully! You can now assign it to characters.` });
    
    // Open assignment modal for the newly created item
    if (createdItem && createdItem.id) {
      setAssignmentModalItem({ id: createdItem.id, name: createdItem.name, type: 'magic-item' });
    }
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

  const handleSaveAssignments = async (characterIds: number[]) => {
    if (!assignmentModalItem) return;
    setAssigning(true);

    if (characterIds.length > 0) {
      try {
        // Create relationships for each selected character
        const relationshipPromises = characterIds.map(characterId => {
          let relationshipType = 'referenced';
          let relationshipData = {};

          switch (assignmentModalItem.type) {
            case 'spell':
              relationshipType = 'known'; // Default to known, can be changed later
              relationshipData = { isPrepared: false, isKnown: true };
              break;
            case 'monster':
              relationshipType = 'companion';
              relationshipData = { notes: '' };
              break;
            case 'magic-item':
              relationshipType = 'owned';
              relationshipData = { isAttuned: false };
              break;
          }

          return createWikiArticleRelationship(
            assignmentModalItem.id,
            'character',
            characterId,
            relationshipType,
            relationshipData
          );
        });

        await Promise.all(relationshipPromises);

        const typeLabel = assignmentModalItem.type === 'magic-item' ? 'Magic item' :
                         assignmentModalItem.type === 'monster' ? 'Monster' : 'Spell';
        setFeedbackMessage({ type: 'success', message: `${typeLabel} "${assignmentModalItem.name}" assigned successfully!` });
        setAssignmentModalItem(null);
        setAssigning(false);
      } catch (error) {
        console.error('Failed to assign entity', error);
        setFeedbackMessage({ type: 'error', message: `Failed to assign ${assignmentModalItem.type}. Please try again.` });
        setAssigning(false);
      }
    } else {
      setAssigning(false);
      setAssignmentModalItem(null);
      setFeedbackMessage({ type: 'info', message: 'No characters selected for assignment.' });
    }
  };

  return (
    <Page title="Wiki Import">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Feedback Messages */}
        <WikiFeedbackMessage
          message={feedbackMessage}
          onDismiss={() => setFeedbackMessage(null)}
        />

        {/* Campaign Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Campaign Selection</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="campaign-select" className="block text-sm font-medium mb-2">
                Select Campaign
              </label>
              <select
                id="campaign-select"
                value={selectedCampaignId || ''}
                onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a campaign...</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title} ({campaign.gameEditionName || campaign.gameEditionVersion || 'Unknown Edition'})
                  </option>
                ))}
              </select>
            </div>
            
            {gameEdition && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Detected Edition:</span> {gameEdition.toUpperCase()}
              </div>
            )}
            
            {availableCategories.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Available Content Types:</span>{' '}
                {availableCategories.map(cat => cat.name).join(', ')}
              </div>
            )}
          </div>
        </div>

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

      {/* Assignment Modal */}
      <CharacterAssignmentModal
        isOpen={assignmentModalItem !== null}
        onClose={() => setAssignmentModalItem(null)}
        onSave={handleSaveAssignments}
        characters={characters}
        initiallySelectedIds={[]}
        isSaving={assigning}
      />
    </Page>
  );
}