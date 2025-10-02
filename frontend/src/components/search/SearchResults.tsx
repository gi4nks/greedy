import React from 'react';
import { SearchResult } from '@greedy/shared';
import { SearchResultCard } from './SearchResultCard';

interface SearchResultsProps {
  searchResults: SearchResult;
  collapsedSessions: { [id: number]: boolean };
  collapsedNpcs: { [id: number]: boolean };
  collapsedLocations: { [id: number]: boolean };
  onToggleCollapseSession: (id?: number) => void;
  onToggleCollapseNpc: (id?: number) => void;
  onToggleCollapseLocation: (id?: number) => void;
  onAddSession: () => void;
  onAddNpc: () => void;
  onAddLocation: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  collapsedSessions,
  collapsedNpcs,
  collapsedLocations,
  onToggleCollapseSession,
  onToggleCollapseNpc,
  onToggleCollapseLocation,
  onAddSession,
  onAddNpc,
  onAddLocation,
}) => {
  return (
    <>
      <section className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Sessions</h3>
          <button onClick={onAddSession} className="btn btn-primary btn-sm">Add</button>
        </div>
        {(searchResults?.sessions || []).map((s) => {
          const isCollapsed = s.id ? collapsedSessions[s.id] ?? true : false;
          return (
            <SearchResultCard
              key={s.id}
              result={s}
              type="session"
              isCollapsed={isCollapsed}
              onToggleCollapse={() => onToggleCollapseSession(s.id)}
            />
          );
        })}
      </section>

      <section className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">NPCs</h3>
          <button onClick={onAddNpc} className="btn btn-primary btn-sm">Add</button>
        </div>
        {(searchResults?.npcs || []).map((n) => {
          const isCollapsed = n.id ? collapsedNpcs[n.id] ?? true : false;
          return (
            <SearchResultCard
              key={n.id}
              result={n}
              type="npc"
              isCollapsed={isCollapsed}
              onToggleCollapse={() => onToggleCollapseNpc(n.id)}
            />
          );
        })}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Locations</h3>
          <button onClick={onAddLocation} className="btn btn-primary btn-sm">Add</button>
        </div>
        {(searchResults?.locations || []).map((l) => {
          const isCollapsed = l.id ? collapsedLocations[l.id] ?? true : false;
          return (
            <SearchResultCard
              key={l.id}
              result={l}
              type="location"
              isCollapsed={isCollapsed}
              onToggleCollapse={() => onToggleCollapseLocation(l.id)}
            />
          );
        })}
      </section>
    </>
  );
};