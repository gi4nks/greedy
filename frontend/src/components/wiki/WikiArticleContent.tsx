import React from 'react';
import { WikiArticleDetails, WikiDataService } from '../../services/WikiDataService';

interface WikiArticleContentProps {
  articleData: WikiArticleDetails;
  onShowRaw: () => void;
}

export const WikiArticleContent: React.FC<WikiArticleContentProps> = ({
  articleData,
  onShowRaw,
}) => {
  return (
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
              onClick={onShowRaw}
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
  );
};