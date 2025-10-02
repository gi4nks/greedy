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
import { useCharacters } from '../hooks/useCharacters';
import { NPCRelationship, RelationshipEvent } from '@greedy/shared';
import {
  RelationshipList,
  RelationshipDetails,
  RelationshipEvents,
  RelationshipForm,
  RelationshipEventForm
} from '../components/relationship';

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
        // For creation, ensure required fields are present
        if (!data.npcId || !data.characterId) {
          toast.push('Please select both NPC and Character', { type: 'error' });
          return;
        }
        await createRelationshipMutation.mutateAsync({
          npcId: data.npcId,
          characterId: data.characterId,
          relationshipType: data.relationshipType || 'neutral',
          strength: data.strength || 0,
          trust: data.trust || 50,
          fear: data.fear || 0,
          respect: data.respect || 50,
          notes: data.notes
        });
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
        <RelationshipList
          relationships={relationships}
          selectedRelationshipId={selectedRelationshipId}
          onSelectRelationship={setSelectedRelationshipId}
          onEditRelationship={handleRelationshipEdit}
          onDeleteRelationship={handleRelationshipDelete}
          getCharacterName={getCharacterName}
        />

        {/* Selected Relationship Details and Events */}
        {selectedRelationship && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RelationshipDetails
              relationship={selectedRelationship}
              getCharacterName={getCharacterName}
            />

            <RelationshipEvents
              events={relationshipEvents}
              onEditEvent={handleEventEdit}
              onDeleteEvent={handleEventDelete}
            />
          </div>
        )}

        {/* Create/Edit Relationship Form */}
        {showCreateRelationshipForm && (
          <RelationshipForm
            formData={relationshipFormData}
            editingId={editingRelationshipId}
            characters={characters}
            charactersLoading={charactersLoading}
            onFormDataChange={setRelationshipFormData}
            onSubmit={handleRelationshipSubmit}
            onCancel={handleRelationshipCancel}
          />
        )}

        {/* Create/Edit Event Form */}
        {showCreateEventForm && selectedRelationshipId && (
          <RelationshipEventForm
            formData={eventFormData}
            editingId={editingEventId}
            onFormDataChange={setEventFormData}
            onSubmit={handleEventSubmit}
            onCancel={handleEventCancel}
          />
        )}
      </div>
    </Page>
  );
};