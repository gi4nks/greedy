import React from 'react';

interface WikiEmptyStateProps {
  hasSearchQuery: boolean;
}

export const WikiEmptyState: React.FC<WikiEmptyStateProps> = ({ hasSearchQuery }) => {
  if (!hasSearchQuery) return null;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="card-title text-lg mb-2">No results found</h3>
        <p className="text-base-content/70">
          Try adjusting your search terms or selecting a different category.
        </p>
      </div>
    </div>
  );
};