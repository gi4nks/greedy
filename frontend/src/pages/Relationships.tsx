import React, { useEffect, useState } from 'react';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { useAdventures } from '../contexts/AdventureContext';
import {
  useRelationships,
  useRelationship,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  useRelationshipEvents,
  useCreateRelationshipEvent,
  useUpdateRelationshipEvent,
  useDeleteRelationshipEvent
} from '../hooks/useRelationships';
import { useQueryClient } from '@tanstack/react-query';
import Skeleton from '../components/Skeleton';
import { useCharacters } from '../hooks/useCharacters';
import { NPCRelationship, RelationshipEvent, Character } from '@greedy/shared';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
  );
}

export const Relationships: React.FC = () => {
  const [showCreateRelationshipForm, setShowCreateRelationshipForm] = useState(false);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [editingRelationshipId, setEditingRelationshipId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<number | null>(null);
  const toast = useToast();
  const adv = useAdventures();
  const queryClient = useQueryClient();

  // Prefetch characters on mount so the form opens quickly
  useEffect(() => {
    const key = ['characters', adv.selectedId || undefined];
    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => {
        const params = adv.selectedId ? `?adventure=${adv.selectedId}` : '';
        const response = await fetch(`/api/characters${params}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      },
      staleTime: 2 * 60 * 1000
    });
  }, [adv.selectedId]);

  // React Query hooks
  const { data: relationships = [], isLoading: relationshipsLoading } = useRelationships(undefined, undefined);
  const { data: characters = [], isLoading: charactersLoading } = useCharacters(adv.selectedId || undefined);
  const { data: selectedRelationship } = useRelationship(selectedRelationshipId || 0);
  const { data: relationshipEvents = [] } = useRelationshipEvents(selectedRelationshipId || 0);

  // Mutations
  const createRelationshipMutation = useCreateRelationship();
  const updateRelationshipMutation = useUpdateRelationship();
  const deleteRelationshipMutation = useDeleteRelationship();
  const createEventMutation = useCreateRelationshipEvent();
  const updateEventMutation = useUpdateRelationshipEvent();
  const deleteEventMutation = useDeleteRelationshipEvent();

  const [relationshipFormData, setRelationshipFormData] = useState<Partial<NPCRelationship>>({
    relationshipType: 'neutral',
    strength: 0,
    trust: 50,
    fear: 0,
    respect: 50,
    notes: '',
  });

  const [eventFormData, setEventFormData] = useState<Partial<RelationshipEvent>>({
    description: '',
    impactValue: 0,
    trustChange: 0,
    fearChange: 0,
    respectChange: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const resetRelationshipForm = () => ({
    relationshipType: 'neutral' as const,
    strength: 0,
    trust: 50,
    fear: 0,
    respect: 50,
    notes: '',
  });

  const resetEventForm = () => ({
    description: '',
    impactValue: 0,
    trustChange: 0,
    fearChange: 0,
    respectChange: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const handleRelationshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...relationshipFormData };
    if (editingRelationshipId) {
      try {
        await updateRelationshipMutation.mutateAsync({
          id: editingRelationshipId,
          relationship: data as Partial<NPCRelationship>
        });
        toast.push('Relationship updated successfully', { type: 'success' });
        setRelationshipFormData(resetRelationshipForm());
        setEditingRelationshipId(null);
        setShowCreateRelationshipForm(false);
      } catch {
        toast.push('Failed to update relationship', { type: 'error' });
      }
    } else {
      try {
        await createRelationshipMutation.mutateAsync(data as Omit<NPCRelationship, 'id' | 'createdAt' | 'updatedAt' | 'history'>);
        toast.push('Relationship created successfully', { type: 'success' });
        setRelationshipFormData(resetRelationshipForm());
        setShowCreateRelationshipForm(false);
      } catch {
        toast.push('Failed to create relationship', { type: 'error' });
      }
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelationshipId) return;

    const data = { ...eventFormData, relationshipId: selectedRelationshipId };
    if (editingEventId) {
      try {
        await updateEventMutation.mutateAsync({
          id: editingEventId,
          event: data as Partial<RelationshipEvent>
        });
        toast.push('Event updated successfully', { type: 'success' });
        setEventFormData(resetEventForm());
        setEditingEventId(null);
        setShowCreateEventForm(false);
      } catch {
        toast.push('Failed to update event', { type: 'error' });
      }
    } else {
      try {
        await createEventMutation.mutateAsync(data as Omit<RelationshipEvent, 'id' | 'createdAt'>);
        toast.push('Event created successfully', { type: 'success' });
        setEventFormData(resetEventForm());
        setShowCreateEventForm(false);
      } catch {
        toast.push('Failed to create event', { type: 'error' });
      }
    }
  };

  const handleRelationshipEdit = (relationship: NPCRelationship) => {
    setRelationshipFormData({
      npcId: relationship.npcId,
      characterId: relationship.characterId,
      relationshipType: relationship.relationshipType,
      strength: relationship.strength,
      trust: relationship.trust,
      fear: relationship.fear,
      respect: relationship.respect,
      notes: relationship.notes,
    });
    setEditingRelationshipId(relationship.id!);
    setShowCreateRelationshipForm(true);
  };

  // When editing is started from a selected relationship (or by id), populate the form
  useEffect(() => {
    // Only populate the form when we're editing and we have the selected relationship
    // Wait until characters have finished loading so the selects can show the selected values
    if (editingRelationshipId && selectedRelationship) {
      if (!charactersLoading) {
        setRelationshipFormData({
          npcId: selectedRelationship.npcId,
          characterId: selectedRelationship.characterId,
          relationshipType: selectedRelationship.relationshipType,
          strength: selectedRelationship.strength,
          trust: selectedRelationship.trust,
          fear: selectedRelationship.fear,
          respect: selectedRelationship.respect,
          notes: selectedRelationship.notes,
        });
        setShowCreateRelationshipForm(true);
      }
    }
  }, [editingRelationshipId, selectedRelationship, charactersLoading]);

  const handleEventEdit = (event: RelationshipEvent) => {
    setEventFormData({
      description: event.description,
      impactValue: event.impactValue,
      trustChange: event.trustChange,
      fearChange: event.fearChange,
      respectChange: event.respectChange,
      date: event.date.split('T')[0],
    });
    setEditingEventId(event.id!);
    setShowCreateEventForm(true);
  };

  const handleRelationshipDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;

    try {
      await deleteRelationshipMutation.mutateAsync(id);
      toast.push('Relationship deleted successfully', { type: 'success' });
      if (selectedRelationshipId === id) {
        setSelectedRelationshipId(null);
      }
    } catch {
      toast.push('Failed to delete relationship', { type: 'error' });
    }
  };

  const handleEventDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEventMutation.mutateAsync(id);
      toast.push('Event deleted successfully', { type: 'success' });
    } catch {
      toast.push('Failed to delete event', { type: 'error' });
    }
  };

  const handleRelationshipCancel = () => {
    setRelationshipFormData(resetRelationshipForm());
    setEditingRelationshipId(null);
    setShowCreateRelationshipForm(false);
  };

  const handleEventCancel = () => {
    setEventFormData(resetEventForm());
    setEditingEventId(null);
    setShowCreateEventForm(false);
  };

  const getCharacterName = (id: number) => {
    const char = characters.find(c => c.id === id);
    return char ? char.name : `Character ${id}`;
  };

  const getRelationshipColor = (strength: number) => {
    if (strength >= 5) return 'text-green-600';
    if (strength <= -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'ally': return 'badge-success';
      case 'enemy': return 'badge-error';
      case 'romantic': return 'badge-warning';
      case 'family': return 'badge-info';
      case 'friend': return 'badge-primary';
      case 'rival': return 'badge-secondary';
      case 'acquaintance': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  };

  if (relationshipsLoading) {
    return (
      <Page title="NPC Relationships">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="NPC Relationships"
      toolbar={
        <div className="flex gap-2">
          <button
            onMouseEnter={() => {
              // warm up characters cache so the form opens instantly
              const key = ['characters', adv.selectedId || undefined];
              void queryClient.prefetchQuery({
                queryKey: key,
                queryFn: async () => {
                  const params = adv.selectedId ? `?adventure=${adv.selectedId}` : '';
                  const response = await fetch(`/api/characters${params}`);
                  if (!response.ok) throw new Error('Network response was not ok');
                  return response.json();
                },
                staleTime: 2 * 60 * 1000
              });
            }}
            onClick={() => { setShowCreateRelationshipForm(true); }}
            className="btn btn-primary btn-sm"
          >
            Create Relationship
          </button>
          {selectedRelationshipId && (
            <button
              onClick={() => { setShowCreateEventForm(true); }}
              className="btn btn-secondary btn-sm"
            >
              Add Event
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Relationships List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">NPC Relationships</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relationships.map((relationship: NPCRelationship) => (
                <div
                  key={relationship.id}
                  className={`card bg-base-200 cursor-pointer transition-colors ${
                    selectedRelationshipId === relationship.id ? 'ring-2 ring-primary' : 'hover:bg-base-300'
                  }`}
                  onClick={() => setSelectedRelationshipId(relationship.id!)}
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="card-title text-lg">
                        {getCharacterName(relationship.characterId)} ↔ {getCharacterName(relationship.npcId)}
                      </h4>
                      <div className={`badge ${getRelationshipTypeColor(relationship.relationshipType)}`}>
                        {relationship.relationshipType}
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className={`font-semibold ${getRelationshipColor(relationship.strength)}`}>
                        Strength: {relationship.strength > 0 ? '+' : ''}{relationship.strength}
                      </p>
                      <p>Trust: {relationship.trust}%</p>
                      <p>Fear: {relationship.fear}%</p>
                      <p>Respect: {relationship.respect}%</p>
                    </div>

                    {relationship.notes && (
                      <p className="text-sm text-base-content/70 mt-2">{relationship.notes}</p>
                    )}
                    {relationship.latestEvent && relationship.latestEvent.date && (
                      <div className="mt-2 text-sm text-base-content/60">
                        <strong>Recent:</strong> {relationship.latestEvent.description} ({new Date(relationship.latestEvent.date).toLocaleDateString()})
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRelationshipEdit(relationship); }}
                        className="btn btn-secondary btn-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (relationship.id) handleRelationshipDelete(relationship.id); }}
                        className="btn btn-neutral btn-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {relationships.length === 0 && (
              <div className="text-center py-8">
                <p className="text-base-content/60">No relationships found. Create your first relationship to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Relationship Details and Events */}
        {selectedRelationship && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Relationship Details */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">
                  {getCharacterName(selectedRelationship.characterId)} ↔ {getCharacterName(selectedRelationship.npcId)}
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Type:</span>
                    <div className={`badge ${getRelationshipTypeColor(selectedRelationship.relationshipType)} ml-2`}>
                      {selectedRelationship.relationshipType}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Strength:</span>
                      <p className={`text-lg font-bold ${getRelationshipColor(selectedRelationship.strength)}`}>
                        {selectedRelationship.strength > 0 ? '+' : ''}{selectedRelationship.strength}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Trust:</span>
                      <p className="text-lg">{selectedRelationship.trust}%</p>
                    </div>
                    <div>
                      <span className="font-semibold">Fear:</span>
                      <p className="text-lg">{selectedRelationship.fear}%</p>
                    </div>
                    <div>
                      <span className="font-semibold">Respect:</span>
                      <p className="text-lg">{selectedRelationship.respect}%</p>
                    </div>
                  </div>

                  {selectedRelationship.notes && (
                    <div>
                      <span className="font-semibold">Notes:</span>
                      <p className="text-sm text-base-content/70 mt-1">{selectedRelationship.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Relationship Events History */}
            <div className="lg:col-span-2 card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Relationship History</h3>
                <div className="space-y-4">
                  {relationshipEvents.map((event: RelationshipEvent) => (
                    <div key={event.id} className="card bg-base-200">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-base-content mb-2">{event.description}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {event.impactValue !== 0 && (
                                <div className={`badge ${event.impactValue > 0 ? 'badge-success' : 'badge-error'}`}>
                                  Strength {event.impactValue > 0 ? '+' : ''}{event.impactValue}
                                </div>
                              )}
                              {event.trustChange !== 0 && (
                                <div className={`badge ${event.trustChange > 0 ? 'badge-success' : 'badge-error'}`}>
                                  Trust {event.trustChange > 0 ? '+' : ''}{event.trustChange}%
                                </div>
                              )}
                              {event.fearChange !== 0 && (
                                <div className={`badge ${event.fearChange > 0 ? 'badge-success' : 'badge-error'}`}>
                                  Fear {event.fearChange > 0 ? '+' : ''}{event.fearChange}%
                                </div>
                              )}
                              {event.respectChange !== 0 && (
                                <div className={`badge ${event.respectChange > 0 ? 'badge-success' : 'badge-error'}`}>
                                  Respect {event.respectChange > 0 ? '+' : ''}{event.respectChange}%
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-base-content/60">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="card-actions">
                            <button
                              onClick={() => handleEventEdit(event)}
                              className="btn btn-secondary btn-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { if (event.id) handleEventDelete(event.id); }}
                              className="btn btn-neutral btn-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {relationshipEvents.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-base-content/60">No relationship events recorded. Add the first event!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Relationship Form */}
        {showCreateRelationshipForm && (
          <form onSubmit={(e) => void handleRelationshipSubmit(e)} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl justify-center">
                {editingRelationshipId ? 'Edit Relationship' : 'Create New Relationship'}
              </h3>

              <div className="space-y-6">
                {/* NPC Selection */}
                <div>
                  <label htmlFor="relationship-npc" className="block text-sm font-medium text-base-content mb-2">NPC *</label>
                  {charactersLoading ? (
                    <Skeleton rows={1} />
                  ) : (
                    <select
                      id="relationship-npc"
                      value={relationshipFormData.npcId || ''}
                      onChange={(e) => setRelationshipFormData({ ...relationshipFormData, npcId: parseInt(e.target.value) })}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select NPC</option>
                      {characters
                        .filter(char => char.character_type === 'npc')
                        .map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} {char.role ? `(${char.role})` : ''}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Character Selection */}
                <div>
                  <label htmlFor="relationship-character" className="block text-sm font-medium text-base-content mb-2">Character *</label>
                  {charactersLoading ? (
                    <Skeleton rows={1} />
                  ) : (
                    <select
                      id="relationship-character"
                      value={relationshipFormData.characterId || ''}
                      onChange={(e) => setRelationshipFormData({ ...relationshipFormData, characterId: parseInt(e.target.value) })}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select Character</option>
                      {characters
                        .filter(char => char.character_type === 'pc')
                        .map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} {char.class ? `(${char.class})` : ''}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Relationship Type */}
                <div>
                  <label htmlFor="relationship-type" className="block text-sm font-medium text-base-content mb-2">Relationship Type</label>
                  <select
                    id="relationship-type"
                    value={relationshipFormData.relationshipType}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, relationshipType: e.target.value as any })}
                    className="select select-bordered w-full"
                  >
                    <option value="ally">Ally</option>
                    <option value="enemy">Enemy</option>
                    <option value="neutral">Neutral</option>
                    <option value="romantic">Romantic</option>
                    <option value="family">Family</option>
                    <option value="friend">Friend</option>
                    <option value="rival">Rival</option>
                    <option value="acquaintance">Acquaintance</option>
                  </select>
                </div>

                {/* Strength, Trust, Fear, Respect */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="relationship-strength" className="block text-sm font-medium text-base-content mb-2">
                      Strength (-10 to +10)
                    </label>
                    <input
                      id="relationship-strength"
                      type="number"
                      value={relationshipFormData.strength}
                      onChange={(e) => setRelationshipFormData({ ...relationshipFormData, strength: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="-10"
                      max="10"
                    />
                  </div>
                  <div>
                    <label htmlFor="relationship-trust" className="block text-sm font-medium text-base-content mb-2">
                      Trust (0-100%)
                    </label>
                    <input
                      id="relationship-trust"
                      type="number"
                      value={relationshipFormData.trust}
                      onChange={(e) => setRelationshipFormData({ ...relationshipFormData, trust: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="relationship-fear" className="block text-sm font-medium text-base-content mb-2">
                      Fear (0-100%)
                    </label>
                    <input
                      id="relationship-fear"
                      type="number"
                      value={relationshipFormData.fear}
                      onChange={(e) => setRelationshipFormData({ ...relationshipFormData, fear: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="relationship-respect" className="block text-sm font-medium text-base-content mb-2">
                      Respect (0-100%)
                    </label>
                    <input
                      id="relationship-respect"
                      type="number"
                      value={relationshipFormData.respect}
                      onChange={(e) => setRelationshipFormData({ ...relationshipFormData, respect: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="relationship-notes" className="block text-sm font-medium text-base-content mb-2">Notes</label>
                  <textarea
                    id="relationship-notes"
                    value={relationshipFormData.notes || ''}
                    onChange={(e) => setRelationshipFormData({ ...relationshipFormData, notes: e.target.value })}
                    rows={3}
                    className="textarea textarea-bordered w-full"
                    placeholder="Additional notes about this relationship"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="card-actions justify-end">
                <button
                  type="button"
                  onClick={handleRelationshipCancel}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={charactersLoading}
                >
                  {editingRelationshipId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Create/Edit Event Form */}
        {showCreateEventForm && selectedRelationshipId && (
          <form onSubmit={(e) => void handleEventSubmit(e)} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl justify-center">
                {editingEventId ? 'Edit Relationship Event' : 'Add Relationship Event'}
              </h3>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label htmlFor="event-description" className="block text-sm font-medium text-base-content mb-2">Description *</label>
                  <textarea
                    id="event-description"
                    required
                    value={eventFormData.description || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    rows={3}
                    className="textarea textarea-bordered w-full"
                    placeholder="Describe what happened in this relationship event"
                  />
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="event-date" className="block text-sm font-medium text-base-content mb-2">Date *</label>
                  <input
                    id="event-date"
                    type="date"
                    required
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Impact Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="event-strength" className="block text-sm font-medium text-base-content mb-2">
                      Strength Change (-10 to +10)
                    </label>
                    <input
                      id="event-strength"
                      type="number"
                      value={eventFormData.impactValue}
                      onChange={(e) => setEventFormData({ ...eventFormData, impactValue: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="-10"
                      max="10"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-trust" className="block text-sm font-medium text-base-content mb-2">
                      Trust Change (-100 to +100)
                    </label>
                    <input
                      id="event-trust"
                      type="number"
                      value={eventFormData.trustChange}
                      onChange={(e) => setEventFormData({ ...eventFormData, trustChange: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="-100"
                      max="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-fear" className="block text-sm font-medium text-base-content mb-2">
                      Fear Change (-100 to +100)
                    </label>
                    <input
                      id="event-fear"
                      type="number"
                      value={eventFormData.fearChange}
                      onChange={(e) => setEventFormData({ ...eventFormData, fearChange: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="-100"
                      max="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-respect" className="block text-sm font-medium text-base-content mb-2">
                      Respect Change (-100 to +100)
                    </label>
                    <input
                      id="event-respect"
                      type="number"
                      value={eventFormData.respectChange}
                      onChange={(e) => setEventFormData({ ...eventFormData, respectChange: parseInt(e.target.value) })}
                      className="input input-bordered w-full"
                      min="-100"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="card-actions justify-end">
                <button
                  type="button"
                  onClick={handleEventCancel}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  {editingEventId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Page>
  );
};