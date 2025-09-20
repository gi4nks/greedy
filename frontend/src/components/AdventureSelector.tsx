import React from 'react';
import { useAdventures } from '../contexts/AdventureContext';

export default function AdventureSelector(): JSX.Element {
  const adventureCtx = useAdventures();

  return (
    <div className="bg-base-200 border-b border-base-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-base-content">Adventure:</span>
            <select
              value={adventureCtx.selectedId ?? ''}
              onChange={(e) => adventureCtx.selectAdventure(e.target.value ? Number(e.target.value) : null)}
              className="select select-bordered select-sm bg-base-100 text-base-content"
            >
              <option value="">🌍 Global</option>
              {adventureCtx.adventures.map(a => (
                <option key={a.id} value={a.id}>📖 {a.title}</option>
              ))}
            </select>
          </div>

          {adventureCtx.selectedId && (() => {
            const ad = adventureCtx.adventures.find(x => x.id === adventureCtx.selectedId);
            const counts = ad && ad.id ? (adventureCtx.counts[ad.id] || { sessions: 0, characters: 0, locations: 0, quests: 0 }) : null;
            return counts ? (
              <div className="flex gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base-content/70">Campaign Stats:</span>
                </div>
                <div className="flex gap-2">
                  <div className="badge badge-info gap-1">
                    <span>📖</span>
                    <span>{counts.sessions} Sessions</span>
                  </div>
                  <div className="badge badge-info gap-1">
                    <span>👥</span>
                    <span>{counts.characters} Characters</span>
                  </div>
                  <div className="badge badge-info gap-1">
                    <span>🗺️</span>
                    <span>{counts.locations} Locations</span>
                  </div>
                  <div className="badge badge-info gap-1">
                    <span>🎯</span>
                    <span>{counts.quests} Quests</span>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}