import React from 'react';
import { WikiArticle, WikiArticleDetails } from '../../services/WikiDataService';
import { WikiArticleCard } from './WikiArticleCard';

interface WikiSearchResultsProps {
  searchResults: WikiArticle[];
  expandedArticles: Set<number>;
  fullContentArticles: Map<number, WikiArticleDetails>;
  onExpand: (article: WikiArticle) => void;
  onShowDetails: (article: WikiArticle) => void;
  onImport: (article: WikiArticle) => void;
  onShowRaw: (content: string) => void;
}

export const WikiSearchResults: React.FC<WikiSearchResultsProps> = ({
  searchResults,
  expandedArticles,
  fullContentArticles,
  onExpand,
  onShowDetails,
  onImport,
  onShowRaw,
}) => {
  if (searchResults.length === 0) return null;

  return (
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
              <WikiArticleCard
                key={article.id}
                article={article}
                isExpanded={isExpanded}
                articleData={articleData}
                onExpand={() => onExpand(article)}
                onShowDetails={() => onShowDetails(article)}
                onImport={() => onImport(article)}
                onShowRaw={() => {
                  const contentToShow = articleData?.isFullContent ? articleData.content : articleData?.extract;
                  onShowRaw(`Raw Content:\n\n${contentToShow || 'No content'}`);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};