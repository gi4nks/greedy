import React from 'react';

interface Category {
  id: string;
  name: string;
  searchFn: (() => Promise<any[]>) | null;
}

interface WikiSearchFormProps {
  searchQuery: string;
  selectedCategory: string;
  categories: Category[];
  loading: boolean;
  onSearchQueryChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

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

export const WikiSearchForm: React.FC<WikiSearchFormProps> = ({
  searchQuery,
  selectedCategory,
  categories,
  loading,
  onSearchQueryChange,
  onCategoryChange,
  onSearch,
  onKeyPress,
}) => {
  return (
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
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Enter search terms..."
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-base-content mb-2">Category</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
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
                onClick={onSearch}
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
  );
};