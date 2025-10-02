import React from 'react';
import { WikiArticle, WikiArticleDetails, WikiDataService } from '../../services/WikiDataService';
import { WikiArticleContent } from './WikiArticleContent';

interface WikiArticleCardProps {
  article: WikiArticle;
  isExpanded: boolean;
  articleData?: WikiArticleDetails;
  onExpand: () => void;
  onShowDetails: () => void;
  onImport: () => void;
  onShowRaw: () => void;
}

export const WikiArticleCard: React.FC<WikiArticleCardProps> = ({
  article,
  isExpanded,
  articleData,
  onExpand,
  onShowDetails,
  onImport,
  onShowRaw,
}) => {
  return (
    <div className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <button
                onClick={onExpand}
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
              onClick={onShowDetails}
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
              onClick={onImport}
              className="btn btn-primary btn-sm"
            >
              Import
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && articleData && (
          <WikiArticleContent
            articleData={articleData}
            onShowRaw={onShowRaw}
          />
        )}
      </div>
    </div>
  );
};