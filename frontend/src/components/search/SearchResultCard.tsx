import React from 'react';
import ReactMarkdown from 'react-markdown';

interface BaseResult {
  id?: number;
  tags?: string[];
}

interface SessionResult extends BaseResult {
  title: string;
  date: string;
  text: string;
}

interface NpcResult extends BaseResult {
  name: string;
  role?: string;
  description?: string;
}

interface LocationResult extends BaseResult {
  name: string;
  description?: string;
  notes?: string;
}

type SearchResult = SessionResult | NpcResult | LocationResult;

interface SearchResultCardProps {
  result: SearchResult;
  type: 'session' | 'npc' | 'location';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = React.memo(({
  result,
  type,
  isCollapsed,
  onToggleCollapse,
}) => {
  const renderTitle = () => {
    if (type === 'session') {
      const session = result as SessionResult;
      return (
        <h4 className="card-title text-lg">
          {session.title} <span className="text-sm text-base-content/70">{session.date}</span>
        </h4>
      );
    } else if (type === 'npc') {
      const npc = result as NpcResult;
      return (
        <h4 className="card-title text-lg">
          {npc.name} <span className="text-sm text-base-content/70">{npc.role}</span>
        </h4>
      );
    } else {
      const location = result as LocationResult;
      return <h4 className="card-title text-lg">{location.name}</h4>;
    }
  };

  const renderContent = () => {
    if (type === 'session') {
      const session = result as SessionResult;
      return (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{session.text}</ReactMarkdown>
        </div>
      );
    } else if (type === 'npc') {
      const npc = result as NpcResult;
      return (
        <>
          {npc.description && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{npc.description}</ReactMarkdown>
            </div>
          )}
          <p className="text-sm text-base-content/70">Tags: {(npc.tags || []).join(', ')}</p>
        </>
      );
    } else {
      const location = result as LocationResult;
      return (
        <>
          {location.description && <p className="text-base-content/70">{location.description}</p>}
          {location.notes && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{location.notes}</ReactMarkdown>
            </div>
          )}
          <p className="text-sm text-base-content/70">Tags: {(location.tags || []).join(', ')}</p>
        </>
      );
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl mb-4">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onToggleCollapse}
            className="btn btn-outline btn-primary btn-sm"
            aria-label={isCollapsed ? '+' : '-'}
          >
            {isCollapsed ? '+' : '−'}
          </button>
          {renderTitle()}
        </div>
        {!isCollapsed && renderContent()}
      </div>
    </div>
  );
});