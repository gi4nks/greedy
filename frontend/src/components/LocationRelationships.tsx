import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './Toast';
import { useAdventures } from '../contexts/AdventureContext';
import { Location, Character, Quest, LocationCharacter, LocationQuest } from '@greedy/shared';

interface LocationRelationshipsProps {
  location: Location & { id: number };
}

export default function LocationRelationships({ location }: LocationRelationshipsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'characters' | 'quests'>('characters');
  const { push: toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedId: adventureId } = useAdventures();

  // Fetch current location with relationships
  const { data: currentLocation } = useQuery<Location & { id: number }>({
    queryKey: ['location', location.id],
    queryFn: async () => {
      const response = await fetch(`/api/locations/${location.id}`);
      if (!response.ok) throw new Error('Failed to fetch location');
      return response.json();
    },
    initialData: location
  });

  // Use currentLocation for relationships, fallback to prop
  const locationWithRelationships = currentLocation || location;

  // Character relationship form state
  const [characterForm, setCharacterForm] = useState({
    character_id: '',
    relationship_type: 'visits' as LocationCharacter['relationship_type'],
    notes: '',
    is_current: false
  });

  // Quest relationship form state  
  const [questForm, setQuestForm] = useState({
    quest_id: '',
    relationship_type: 'takes_place_at' as LocationQuest['relationship_type'],
    notes: '',
    is_primary: false
  });

  // Fetch available characters
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ['characters', adventureId],
    queryFn: async () => {
      const params = adventureId ? `?adventure=${adventureId}` : '';
      const response = await fetch(`/api/characters${params}`);
      if (!response.ok) throw new Error('Failed to fetch characters');
      return response.json();
    }
  });

  // Fetch available quests
  const { data: quests = [] } = useQuery<Quest[]>({
    queryKey: ['quests', adventureId],
    queryFn: async () => {
      const params = adventureId ? `?adventure=${adventureId}` : '';
      const response = await fetch(`/api/quests${params}`);
      if (!response.ok) throw new Error('Failed to fetch quests');
      return response.json();
    }
  });

  // Add character relationship mutation
  const addCharacterMutation = useMutation({
    mutationFn: async (data: typeof characterForm) => {
      const payload = {
        ...data,
        character_id: Number(data.character_id)
      };
      const response = await fetch(`/api/locations/${location.id}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to add character relationship');
      return response.json();
    },
    onSuccess: () => {
      toast('Character relationship added successfully', { type: 'success' });
      setCharacterForm({
        character_id: '',
        relationship_type: 'visits',
        notes: '',
        is_current: false
      });
      queryClient.invalidateQueries({ queryKey: ['location', location.id] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: Error) => {
      toast(`Error adding character relationship: ${error.message}`, { type: 'error' });
    }
  });

  // Add quest relationship mutation
  const addQuestMutation = useMutation({
    mutationFn: async (data: typeof questForm) => {
      const payload = {
        ...data,
        quest_id: Number(data.quest_id)
      };
      const response = await fetch(`/api/locations/${location.id}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to add quest relationship');
      return response.json();
    },
    onSuccess: () => {
      toast('Quest relationship added successfully', { type: 'success' });
      setQuestForm({
        quest_id: '',
        relationship_type: 'takes_place_at',
        notes: '',
        is_primary: false
      });
      queryClient.invalidateQueries({ queryKey: ['location', location.id] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: Error) => {
      toast(`Error adding quest relationship: ${error.message}`, { type: 'error' });
    }
  });

  // Remove character relationship mutation
  const removeCharacterMutation = useMutation({
    mutationFn: async ({ characterId, relationshipType }: { characterId: number; relationshipType: string }) => {
      const params = new URLSearchParams({ relationship_type: relationshipType });
      const response = await fetch(`/api/locations/${location.id}/characters/${characterId}?${params}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove character relationship');
      return response.json();
    },
    onSuccess: () => {
      toast('Character relationship removed successfully', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['location', location.id] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: Error) => {
      toast(`Error removing character relationship: ${error.message}`, { type: 'error' });
    }
  });

  // Remove quest relationship mutation
  const removeQuestMutation = useMutation({
    mutationFn: async ({ questId, relationshipType }: { questId: number; relationshipType: string }) => {
      const params = new URLSearchParams({ relationship_type: relationshipType });
      const response = await fetch(`/api/locations/${location.id}/quests/${questId}?${params}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove quest relationship');
      return response.json();
    },
    onSuccess: () => {
      toast('Quest relationship removed successfully', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['location', location.id] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: Error) => {
      toast(`Error removing quest relationship: ${error.message}`, { type: 'error' });
    }
  });

  const handleAddCharacter = () => {
    if (!characterForm.character_id) return;
    addCharacterMutation.mutate(characterForm);
  };

  const handleAddQuest = () => {
    if (!questForm.quest_id) return;
    addQuestMutation.mutate(questForm);
  };

  const getCharacterRelationshipIcon = (type: LocationCharacter['relationship_type']) => {
    switch (type) {
      case 'lives_at': return '🏠';
      case 'works_at': return '💼';
      case 'owns': return '👑';
      case 'frequents': return '🔄';
      case 'avoids': return '❌';
      default: return '👋'; // visits
    }
  };

  const getQuestRelationshipIcon = (type: LocationQuest['relationship_type']) => {
    switch (type) {
      case 'starts_at': return '🚀';
      case 'ends_at': return '🏁';
      case 'leads_to': return '➡️';
      case 'involves': return '🔗';
      default: return '📍'; // takes_place_at
    }
  };

  return (
    <div className="mt-6 border-t border-base-300 pt-6">
      <h4 className="text-lg font-semibold mb-4">Relationships</h4>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-4">
        <button
          onClick={() => setActiveTab('characters')}
          className={`tab ${activeTab === 'characters' ? 'tab-active' : ''}`}
        >
          Characters ({locationWithRelationships.characters?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`tab ${activeTab === 'quests' ? 'tab-active' : ''}`}
        >
          Quests ({locationWithRelationships.quests?.length || 0})
        </button>
      </div>

      {/* Characters Tab */}
      {activeTab === 'characters' && (
        <div className="space-y-4">
          {/* Add Character Form */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title text-sm">Add Character Relationship</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={characterForm.character_id}
                  onChange={(e) => setCharacterForm({ ...characterForm, character_id: e.target.value })}
                  className="select select-bordered select-sm"
                  required
                >
                  <option value="">Select Character</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.name} ({char.character_type})
                    </option>
                  ))}
                </select>
                <select
                  value={characterForm.relationship_type}
                  onChange={(e) => setCharacterForm({ ...characterForm, relationship_type: e.target.value as LocationCharacter['relationship_type'] })}
                  className="select select-bordered select-sm"
                >
                  <option value="visits">Visits</option>
                  <option value="lives_at">Lives At</option>
                  <option value="works_at">Works At</option>
                  <option value="owns">Owns</option>
                  <option value="frequents">Frequents</option>
                  <option value="avoids">Avoids</option>
                </select>
                <div className="form-control">
                  <label className="label cursor-pointer py-0">
                    <span className="label-text text-xs">Current Location</span>
                    <input
                      type="checkbox"
                      checked={characterForm.is_current}
                      onChange={(e) => setCharacterForm({ ...characterForm, is_current: e.target.checked })}
                      className="checkbox checkbox-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleAddCharacter}
                  disabled={!characterForm.character_id || addCharacterMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  {addCharacterMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
              {characterForm.relationship_type !== 'visits' && (
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={characterForm.notes}
                  onChange={(e) => setCharacterForm({ ...characterForm, notes: e.target.value })}
                  className="input input-bordered input-sm mt-2"
                />
              )}
            </div>
          </div>

          {/* Existing Character Relationships */}
          <div className="space-y-2">
            {locationWithRelationships.characters?.map((rel) => (
              <div key={`${rel.character_id}-${rel.relationship_type}`} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCharacterRelationshipIcon(rel.relationship_type)}</span>
                  <div>
                    <span className="font-medium">{(rel as any).character_name}</span>
                    <div className="text-sm text-base-content/70 capitalize">
                      {rel.relationship_type.replace('_', ' ')}
                      {rel.is_current && <span className="badge badge-primary badge-xs ml-2">Current</span>}
                    </div>
                    {rel.notes && <div className="text-xs text-base-content/60">{rel.notes}</div>}
                  </div>
                </div>
                <button
                  onClick={() => removeCharacterMutation.mutate({ 
                    characterId: rel.character_id, 
                    relationshipType: rel.relationship_type 
                  })}
                  disabled={removeCharacterMutation.isPending}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Remove
                </button>
              </div>
            ))}
            {!locationWithRelationships.characters?.length && (
              <p className="text-center text-base-content/60 py-4">No character relationships</p>
            )}
          </div>
        </div>
      )}

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          {/* Add Quest Form */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title text-sm">Add Quest Relationship</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={questForm.quest_id}
                  onChange={(e) => setQuestForm({ ...questForm, quest_id: e.target.value })}
                  className="select select-bordered select-sm"
                  required
                >
                  <option value="">Select Quest</option>
                  {quests.map(quest => (
                    <option key={quest.id} value={quest.id}>
                      {quest.title} ({quest.status})
                    </option>
                  ))}
                </select>
                <select
                  value={questForm.relationship_type}
                  onChange={(e) => setQuestForm({ ...questForm, relationship_type: e.target.value as LocationQuest['relationship_type'] })}
                  className="select select-bordered select-sm"
                >
                  <option value="takes_place_at">Takes Place At</option>
                  <option value="starts_at">Starts At</option>
                  <option value="ends_at">Ends At</option>
                  <option value="leads_to">Leads To</option>
                  <option value="involves">Involves</option>
                </select>
                <div className="form-control">
                  <label className="label cursor-pointer py-0">
                    <span className="label-text text-xs">Primary Location</span>
                    <input
                      type="checkbox"
                      checked={questForm.is_primary}
                      onChange={(e) => setQuestForm({ ...questForm, is_primary: e.target.checked })}
                      className="checkbox checkbox-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuest}
                  disabled={!questForm.quest_id || addQuestMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  {addQuestMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
              {questForm.relationship_type !== 'takes_place_at' && (
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={questForm.notes}
                  onChange={(e) => setQuestForm({ ...questForm, notes: e.target.value })}
                  className="input input-bordered input-sm mt-2"
                />
              )}
            </div>
          </div>

          {/* Existing Quest Relationships */}
          <div className="space-y-2">
            {locationWithRelationships.quests?.map((rel) => (
              <div key={`${rel.quest_id}-${rel.relationship_type}`} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getQuestRelationshipIcon(rel.relationship_type)}</span>
                  <div>
                    <span className="font-medium">{(rel as any).quest_title}</span>
                    <div className="text-sm text-base-content/70 capitalize">
                      {rel.relationship_type.replace('_', ' ')}
                      {rel.is_primary && <span className="badge badge-primary badge-xs ml-2">Primary</span>}
                    </div>
                    {rel.notes && <div className="text-xs text-base-content/60">{rel.notes}</div>}
                  </div>
                </div>
                <button
                  onClick={() => removeQuestMutation.mutate({ 
                    questId: rel.quest_id, 
                    relationshipType: rel.relationship_type 
                  })}
                  disabled={removeQuestMutation.isPending}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Remove
                </button>
              </div>
            ))}
            {!locationWithRelationships.quests?.length && (
              <p className="text-center text-base-content/60 py-4">No quest relationships</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}