import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type Adventure = { id?: number; slug?: string; title: string; description?: string };

type AdventureContextValue = {
  adventures: Adventure[];
  selectedId: number | null;
  selectAdventure: (id: number | null) => void;
  counts: Record<number, { sessions: number; npcs: number; locations: number } | undefined>;
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
    axios.get('/api/adventures').then(res => setAdventures(res.data || []));
    // fetch export to compute counts per adventure (lightweight for small DBs)
    axios.get('/api/export').then(res => {
      const payload = res.data || {};
      const byId: typeof counts = {};
      (payload.adventures || []).forEach((a: any) => { if (a && a.id) byId[a.id] = { sessions: 0, npcs: 0, locations: 0 }; });
      (payload.sessions || []).forEach((s: any) => { if (s && s.adventure_id && byId[s.adventure_id]) byId[s.adventure_id]!.sessions += 1; });
      (payload.npcs || []).forEach((n: any) => { if (n && n.adventure_id && byId[n.adventure_id]) byId[n.adventure_id]!.npcs += 1; });
      (payload.locations || []).forEach((l: any) => { if (l && l.adventure_id && byId[l.adventure_id]) byId[l.adventure_id]!.locations += 1; });
      setCounts(byId);
    }).catch(() => {});
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
