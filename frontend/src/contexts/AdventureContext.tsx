import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type Adventure = { id?: number; slug?: string; title: string; description?: string };

type Session = { id?: number; adventure_id?: number };
type Character = { id?: number; adventure_id?: number };
type Location = { id?: number; adventure_id?: number };

type ExportPayload = {
  adventures: Adventure[];
  sessions: Session[];
  characters: Character[];
  locations: Location[];
};

type AdventureContextValue = {
  adventures: Adventure[];
  selectedId: number | null;
  selectAdventure: (id: number | null) => void;
  counts: Record<number, { sessions: number; characters: number; locations: number } | undefined>;
};

const AdventureContext = createContext<AdventureContextValue | undefined>(undefined);

export function AdventureProvider({ children }: { children: React.ReactNode }) {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const raw = localStorage.getItem('selectedAdventure');
    return raw ? Number(raw) : null;
  });
  const [counts, setCounts] = useState<AdventureContextValue['counts']>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [adventuresRes, exportRes] = await Promise.all([
          axios.get('/api/adventures'),
          axios.get('/api/export')
        ]);

        const adventures: Adventure[] = (adventuresRes.data as Adventure[]) || [];
        setAdventures(adventures);

        const payload: ExportPayload = (exportRes.data as ExportPayload) || {};
        const byId: typeof counts = {};
        (payload.adventures || []).forEach((a) => { if (a && a.id) byId[a.id] = { sessions: 0, characters: 0, locations: 0 }; });
        (payload.sessions || []).forEach((s) => { if (s && s.adventure_id && byId[s.adventure_id]) byId[s.adventure_id]!.sessions += 1; });
        (payload.characters || []).forEach((c) => { if (c && c.adventure_id && byId[c.adventure_id]) byId[c.adventure_id]!.characters += 1; });
        (payload.locations || []).forEach((l) => { if (l && l.adventure_id && byId[l.adventure_id]) byId[l.adventure_id]!.locations += 1; });
        setCounts(byId);
      } catch {
        // Handle errors silently for now
      }
    };

    void loadData();
  }, []);

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
