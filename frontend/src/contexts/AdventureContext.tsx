import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAdventures as useAdventuresQuery } from '../hooks/useAdventures';
import { useAdventureCounts } from '../hooks/useAdventureCounts';

type Adventure = { id?: number; slug?: string; title: string; description?: string };

type AdventureContextValue = {
  adventures: Adventure[];
  selectedId: number | null;
  selectAdventure: (id: number | null) => void;
  counts: Record<number, { sessions: number; characters: number; locations: number; quests: number } | undefined>;
};

const AdventureContext = createContext<AdventureContextValue | undefined>(undefined);

export function AdventureProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const raw = localStorage.getItem('selectedAdventure');
    return raw ? Number(raw) : null;
  });

  // Use React Query for adventures data
  const { data: adventures = [] } = useAdventuresQuery();
  const { data: counts = {} } = useAdventureCounts();

  useEffect(() => {
    if (selectedId === null) localStorage.removeItem('selectedAdventure');
    else localStorage.setItem('selectedAdventure', String(selectedId));
  }, [selectedId]);

  return (
    <AdventureContext.Provider value={{ adventures, selectedId, selectAdventure: setSelectedId, counts }}>
      {children}
    </AdventureContext.Provider>
  );
}

export function useAdventures() {
  const ctx = useContext(AdventureContext);
  if (!ctx) throw new Error('useAdventures must be used inside AdventureProvider');
  return ctx;
}

export default AdventureContext;
