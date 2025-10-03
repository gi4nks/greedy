import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdventures } from '../contexts/AdventureContext';
import Page from '../components/Page';
import { useSearch } from '../hooks/useSearch';
import { useCreateSession } from '../hooks/useSessions';
import { useCreateNPC } from '../hooks/useNPCs';
import { useCreateLocation } from '../hooks/useLocations';
import {
  SearchInput,
  SearchResults,
  CreateItemModal
} from '../components/search';

export default function Search(): JSX.Element {
  const [params] = useSearchParams();
  const qParam = params.get('q') || '';
  const [q, setQ] = useState(qParam);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formType, setFormType] = useState<'session' | 'npc' | 'location' | null>(null);
  const [collapsedSessions, setCollapsedSessions] = useState<{ [id: number]: boolean }>({});
  const [collapsedNpcs, setCollapsedNpcs] = useState<{ [id: number]: boolean }>({});
  const [collapsedLocations, setCollapsedLocations] = useState<{ [id: number]: boolean }>({});

  const adv = useAdventures();
  const { data: searchResults } = useSearch(q, adv.selectedId || undefined);
  const createSessionMutation = useCreateSession();
  const createNPCMutation = useCreateNPC();
  const createLocationMutation = useCreateLocation();

  const handleCreateItem = (type: 'session' | 'npc' | 'location') => {
    setFormType(type);
    setShowCreateForm(true);
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setFormType(null);
  };

  const handleCreateSession = async (data: { title: string; date: string; text: string; adventure_id?: number | null }) => {
    const payload = { ...data, adventure_id: data.adventure_id ?? adv.selectedId };
    await createSessionMutation.mutateAsync(payload);
    handleCloseModal();
  };

  const handleCreateNPC = async (data: { name: string; role: string; description: string; tags: string[] }) => {
    await createNPCMutation.mutateAsync(data);
    handleCloseModal();
  };

  const handleCreateLocation = async (data: { name: string; description: string; notes: string; tags: string[] }) => {
    await createLocationMutation.mutateAsync(data);
    handleCloseModal();
  };

  const toggleCollapseSession = (id?: number) => {
    if (!id) return;
    setCollapsedSessions(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const toggleCollapseNpc = (id?: number) => {
    if (!id) return;
    setCollapsedNpcs(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const toggleCollapseLocation = (id?: number) => {
    if (!id) return;
    setCollapsedLocations(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  return (
    <Page title="Search">
      <SearchInput value={q} onChange={setQ} />

      <SearchResults
        searchResults={searchResults || { sessions: [], npcs: [], locations: [], characters: [], quests: [], magicItems: [] }}
        collapsedSessions={collapsedSessions}
        collapsedNpcs={collapsedNpcs}
        collapsedLocations={collapsedLocations}
        onToggleCollapseSession={toggleCollapseSession}
        onToggleCollapseNpc={toggleCollapseNpc}
        onToggleCollapseLocation={toggleCollapseLocation}
        onAddSession={() => { handleCreateItem('session'); }}
        onAddNpc={() => { handleCreateItem('npc'); }}
        onAddLocation={() => { handleCreateItem('location'); }}
      />

      {showCreateForm && formType && (
        <CreateItemModal
          type={formType}
          onClose={handleCloseModal}
          onCreateSession={(data) => { void handleCreateSession(data); }}
          onCreateNPC={(data) => { void handleCreateNPC(data); }}
          onCreateLocation={(data) => { void handleCreateLocation(data); }}
          adventures={adv.adventures}
          selectedAdventureId={adv.selectedId || undefined}
        />
      )}
    </Page>
  );
}
