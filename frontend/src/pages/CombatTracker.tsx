import React, { useState } from 'react';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { useAdventures } from '../contexts/AdventureContext';
import { useCharacters } from '../hooks/useCharacters';
import { useNPCs } from '../hooks/useNPCs';
import {
  useCombatEncounters,
  useCombatEncounter,
  useCreateCombatEncounter,
  useUpdateCombatEncounter,
  useDeleteCombatEncounter,
  useCombatParticipants,
  useCreateCombatParticipant,
  useUpdateCombatParticipant,
  useDeleteCombatParticipant
} from '../hooks/useCombat';
import { CombatEncounter, CombatParticipant } from '@greedy/shared';
import {
  CombatEncounterList,
  CombatStatus,
  CombatParticipants,
  CombatEncounterForm,
  AddParticipantModal
} from '../components/combat';

export default function CombatTracker(): JSX.Element {
  const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);
  const [showCreateEncounterForm, setShowCreateEncounterForm] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const adv = useAdventures();

  // React Query hooks
  const { data: encounters = [], isLoading: encountersLoading } = useCombatEncounters(adv.selectedId || undefined);
  const { data: selectedEncounter } = useCombatEncounter(selectedEncounterId || 0);
  const { data: participants = [] } = useCombatParticipants(selectedEncounterId || 0);

  // Mutations
  const createEncounterMutation = useCreateCombatEncounter();
  const updateEncounterMutation = useUpdateCombatEncounter();
  const deleteEncounterMutation = useDeleteCombatEncounter();
  const createParticipantMutation = useCreateCombatParticipant();
  const updateParticipantMutation = useUpdateCombatParticipant();
  const deleteParticipantMutation = useDeleteCombatParticipant();

  // Available characters and NPCs for adding to combat
  const { data: availableCharacters = [] } = useCharacters(adv.selectedId || undefined);
  const { data: availableNpcs = [] } = useNPCs(adv.selectedId || undefined);

  const [encounterFormData, setEncounterFormData] = useState<Partial<CombatEncounter>>({
    name: '',
    sessionId: 0,
    round: 1,
    status: 'active',
  });

  const resetEncounterForm = () => ({
    name: '',
    sessionId: 0,
    round: 1,
    status: 'active' as const,
  });

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adv.selectedId) {
      toast.push('Please select an adventure first', { type: 'error' });
      return;
    }

    try {
      const encounter = await createEncounterMutation.mutateAsync({
        ...encounterFormData,
        sessionId: adv.selectedId,
      } as Omit<CombatEncounter, 'id' | 'createdAt'>);
      toast.push('Combat encounter created successfully', { type: 'success' });
      setEncounterFormData(resetEncounterForm());
      setShowCreateEncounterForm(false);
      setSelectedEncounterId(encounter.id);
    } catch {
      toast.push('Failed to create combat encounter', { type: 'error' });
    }
  };

  const handleUpdateEncounter = async (updates: Partial<CombatEncounter>) => {
    if (!selectedEncounterId) return;

    try {
      await updateEncounterMutation.mutateAsync({
        id: selectedEncounterId,
        encounter: updates
      });
      toast.push('Encounter updated successfully', { type: 'success' });
    } catch {
      toast.push('Failed to update encounter', { type: 'error' });
    }
  };

  const handleDeleteEncounter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this encounter?')) return;

    try {
      await deleteEncounterMutation.mutateAsync(id);
      toast.push('Encounter deleted successfully', { type: 'success' });
      if (selectedEncounterId === id) {
        setSelectedEncounterId(null);
      }
    } catch {
      toast.push('Failed to delete encounter', { type: 'error' });
    }
  };

  const handleAddParticipant = async (characterId: number, isNpc: boolean) => {
    if (!selectedEncounterId) return;

    const character = isNpc
      ? availableNpcs.find(n => n.id === characterId)
      : availableCharacters.find(c => c.id === characterId);

    if (!character) return;

    try {
      await createParticipantMutation.mutateAsync({
        encounterId: selectedEncounterId,
        characterId,
        initiative: 0,
        currentHp: (character as any).hitPoints || 10,
        maxHp: (character as any).hitPoints || 10,
        armorClass: (character as any).armorClass || 10,
        conditions: [],
        notes: '',
        isNpc,
        hasAction: true,
        hasBonusAction: true,
        hasReaction: true,
        hasMovement: true,
      });
      toast.push('Participant added successfully', { type: 'success' });
    } catch {
      toast.push('Failed to add participant', { type: 'error' });
    }
  };

  const handleUpdateParticipant = async (id: number, updates: Partial<CombatParticipant>) => {
    try {
      await updateParticipantMutation.mutateAsync({
        id,
        participant: updates
      });
      toast.push('Participant updated successfully', { type: 'success' });
    } catch {
      toast.push('Failed to update participant', { type: 'error' });
    }
  };

  const handleRemoveParticipant = async (id: number) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      await deleteParticipantMutation.mutateAsync(id);
      toast.push('Participant removed successfully', { type: 'success' });
    } catch {
      toast.push('Failed to remove participant', { type: 'error' });
    }
  };

  const nextTurn = () => {
    if (!selectedEncounter) return;

    const currentIndex = participants.findIndex((p: CombatParticipant) => p.id === selectedEncounter.activeCombatantId);
    const nextIndex = (currentIndex + 1) % participants.length;
    const nextParticipant = participants[nextIndex];

    let newRound = selectedEncounter.round;
    if (nextIndex === 0) {
      newRound += 1;
    }

    void handleUpdateEncounter({
      activeCombatantId: nextParticipant?.id,
      round: newRound
    });
  };

  const previousTurn = () => {
    if (!selectedEncounter) return;

    const currentIndex = participants.findIndex((p: CombatParticipant) => p.id === selectedEncounter.activeCombatantId);
    const prevIndex = currentIndex === 0 ? participants.length - 1 : currentIndex - 1;
    const prevParticipant = participants[prevIndex];

    let newRound = selectedEncounter.round;
    if (prevIndex === participants.length - 1) {
      newRound = Math.max(1, newRound - 1);
    }

    void handleUpdateEncounter({
      activeCombatantId: prevParticipant?.id,
      round: newRound
    });
  };

  const startCombat = () => {
    if (participants.length === 0) return;

    void handleUpdateEncounter({
      status: 'active',
      activeCombatantId: participants[0]?.id,
      round: 1
    });
  };

  const endCombat = () => {
    void handleUpdateEncounter({
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  };

  const filteredCharacters = availableCharacters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNpcs = availableNpcs.filter(n =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (encountersLoading) {
    return (
      <Page title="Combat Tracker">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Combat Tracker"
      toolbar={
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateEncounterForm(true)}
            className="btn btn-primary btn-sm"
          >
            New Encounter
          </button>
          {selectedEncounterId && (
            <button
              onClick={() => setShowAddParticipantModal(true)}
              className="btn btn-success btn-sm"
            >
              Add Participant
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <CombatEncounterList
          encounters={encounters}
          selectedEncounterId={selectedEncounterId}
          onSelectEncounter={setSelectedEncounterId}
          onDeleteEncounter={handleDeleteEncounter}
        />

        {/* Selected Encounter Details */}
        {selectedEncounter && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <CombatStatus
              encounter={selectedEncounter}
              participants={participants}
              onPreviousTurn={previousTurn}
              onNextTurn={nextTurn}
              onStartCombat={startCombat}
              onEndCombat={endCombat}
            />

            <div className="lg:col-span-3">
              <CombatParticipants
                encounter={selectedEncounter}
                participants={participants}
                onUpdateParticipant={handleUpdateParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                onAddParticipant={() => setShowAddParticipantModal(true)}
              />
            </div>
          </div>
        )}

        {/* Create Encounter Form */}
        {showCreateEncounterForm && (
          <CombatEncounterForm
            formData={encounterFormData}
            onFormDataChange={setEncounterFormData}
            onSubmit={handleCreateEncounter}
            onCancel={() => { setEncounterFormData(resetEncounterForm()); setShowCreateEncounterForm(false); }}
          />
        )}

        {/* Add Participant Modal */}
        <AddParticipantModal
          isOpen={showAddParticipantModal}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          characters={availableCharacters}
          npcs={availableNpcs}
          onAddParticipant={handleAddParticipant}
          onClose={() => setShowAddParticipantModal(false)}
        />
      </div>
    </Page>
  );
}