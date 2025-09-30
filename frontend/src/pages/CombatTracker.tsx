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
  useDeleteCombatParticipant,
  useCombatConditions,
  useCreateCombatCondition,
  useUpdateCombatCondition,
  useDeleteCombatCondition
} from '../hooks/useCombat';
import { CombatEncounter, CombatParticipant, CombatCondition } from '@greedy/shared';

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
  const createConditionMutation = useCreateCombatCondition();
  const updateConditionMutation = useUpdateCombatCondition();
  const deleteConditionMutation = useDeleteCombatCondition();

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

  const handleAddCondition = async (participantId: number, conditionName: string) => {
    try {
      await createConditionMutation.mutateAsync({
        name: conditionName,
        description: '',
        duration: 1,
        source: 'manual',
        effects: [],
      });
      toast.push('Condition added successfully', { type: 'success' });
    } catch {
      toast.push('Failed to add condition', { type: 'error' });
    }
  };

  const handleRemoveCondition = async (conditionId: string) => {
    try {
      await deleteConditionMutation.mutateAsync(conditionId);
      toast.push('Condition removed successfully', { type: 'success' });
    } catch {
      toast.push('Failed to remove condition', { type: 'error' });
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

    handleUpdateEncounter({
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

    handleUpdateEncounter({
      activeCombatantId: prevParticipant?.id,
      round: newRound
    });
  };

  const startCombat = () => {
    if (participants.length === 0) return;

    handleUpdateEncounter({
      status: 'active',
      activeCombatantId: participants[0]?.id,
      round: 1
    });
  };

  const endCombat = () => {
    handleUpdateEncounter({
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

  const getHpColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 75) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    if (percentage >= 25) return 'text-orange-500';
    return 'text-error';
  };

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
        {/* Encounters List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Combat Encounters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {encounters.map((encounter: CombatEncounter) => (
                <div
                  key={encounter.id}
                  className={`card bg-base-200 cursor-pointer transition-colors ${
                    selectedEncounterId === encounter.id ? 'ring-2 ring-primary' : 'hover:bg-base-300'
                  }`}
                  onClick={() => setSelectedEncounterId(encounter.id!)}
                >
                  <div className="card-body">
                    <h4 className="card-title text-lg">{encounter.name}</h4>
                    <p className="text-sm text-base-content/70">
                      Round: {encounter.round} | Status: {encounter.status}
                    </p>
                    <div className={`badge ${
                      encounter.status === 'active' ? 'badge-success' :
                      encounter.status === 'completed' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {encounter.status}
                    </div>
                    <div className="card-actions justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); if (encounter.id) handleDeleteEncounter(encounter.id); }}
                        className="btn btn-neutral btn-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {encounters.length === 0 && (
              <div className="text-center py-8">
                <p className="text-base-content/60">No combat encounters found. Create your first encounter!</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Encounter Details */}
        {selectedEncounter && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Combat Status */}
            <div className="lg:col-span-1">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-xl">⚔️ Combat Status</h3>

                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{selectedEncounter.round}</div>
                      <div className="text-sm text-base-content/70">Round</div>
                    </div>

                    {selectedEncounter.status === 'active' && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-base-content">
                          {participants.find((p: CombatParticipant) => p.id === selectedEncounter.activeCombatantId)?.character?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-base-content/70">Current Turn</div>
                      </div>
                    )}

                    <div className={`text-center p-2 rounded ${
                      selectedEncounter.status === 'active' ? 'bg-success/20 text-success' :
                      selectedEncounter.status === 'completed' ? 'bg-info/20 text-info' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {selectedEncounter.status.toUpperCase()}
                    </div>

                    <div className="flex justify-center gap-2">
                      <button
                        onClick={previousTurn}
                        disabled={selectedEncounter.status !== 'active'}
                        className="btn btn-outline btn-sm"
                      >
                        Previous
                      </button>
                      <button
                        onClick={nextTurn}
                        disabled={selectedEncounter.status !== 'active'}
                        className="btn btn-primary btn-sm"
                      >
                        Next
                      </button>
                    </div>

                    {selectedEncounter.status === 'active' ? (
                      <button
                        onClick={endCombat}
                        className="btn btn-neutral btn-sm w-full"
                      >
                        End Combat
                      </button>
                    ) : selectedEncounter.status === 'paused' ? (
                      <button
                        onClick={startCombat}
                        className="btn btn-success btn-sm w-full"
                      >
                        Resume Combat
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="lg:col-span-3">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-xl">👥 Participants ({participants.length})</h3>

                  {participants.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">⚔️</div>
                      <p className="text-lg mb-4 text-base-content/70">No participants added yet</p>
                      <button
                        onClick={() => setShowAddParticipantModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        Add Participant
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {participants
                        .sort((a: CombatParticipant, b: CombatParticipant) => b.initiative - a.initiative)
                        .map((participant: CombatParticipant) => (
                        <div
                          key={participant.id}
                          className={`card border-2 transition-all duration-200 ${
                            selectedEncounter.activeCombatantId === participant.id
                              ? 'border-primary bg-primary/5 shadow-lg'
                              : 'border-base-300 bg-base-200'
                          }`}
                        >
                          <div className="card-body p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {selectedEncounter.activeCombatantId === participant.id && (
                                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                )}
                                <div>
                                  <h4 className="card-title text-lg">{participant.character?.name || 'Unknown'}</h4>
                                  <div className="text-sm text-base-content/70">
                                    Initiative: {participant.initiative} | AC: {participant.armorClass}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => { if (participant.id) handleRemoveParticipant(participant.id); }}
                                className="btn btn-error btn-xs"
                              >
                                Remove
                              </button>
                            </div>

                            {/* HP Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">HP</span>
                                <span className={`text-sm font-bold ${getHpColor(participant.currentHp, participant.maxHp)}`}>
                                  {participant.currentHp}/{participant.maxHp}
                                </span>
                              </div>
                              <progress
                                className="progress w-full"
                                value={(participant.currentHp / participant.maxHp) * 100}
                                max="100"
                              ></progress>
                            </div>

                            {/* Action Economy */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              <div className={`text-center p-2 rounded text-xs ${
                                participant.hasAction ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/50'
                              }`}>
                                Action
                              </div>
                              <div className={`text-center p-2 rounded text-xs ${
                                participant.hasBonusAction ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/50'
                              }`}>
                                Bonus
                              </div>
                              <div className={`text-center p-2 rounded text-xs ${
                                participant.hasReaction ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/50'
                              }`}>
                                Reaction
                              </div>
                              <div className={`text-center p-2 rounded text-xs ${
                                participant.hasMovement ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/50'
                              }`}>
                                Move
                              </div>
                            </div>

                            {/* Conditions */}
                            <div className="mb-3">
                              <div className="text-sm font-medium mb-2">Conditions:</div>
                              <div className="flex flex-wrap gap-2">
                                {participant.conditions.map((condition: CombatCondition) => (
                                  <div
                                    key={condition.id}
                                    className="badge badge-error gap-1"
                                  >
                                    {condition.name}
                                    <button
                                      onClick={() => handleRemoveCondition(condition.id)}
                                      className="btn btn-xs btn-ghost btn-circle"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            <textarea
                              value={participant.notes}
                              onChange={(e) => {
                                if (participant.id) {
                                  handleUpdateParticipant(participant.id, { notes: e.target.value });
                                }
                              }}
                              placeholder="Notes..."
                              className="textarea textarea-bordered textarea-sm w-full"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Encounter Form */}
        {showCreateEncounterForm && (
          <form onSubmit={(e) => void handleCreateEncounter(e)} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl justify-center">Create New Combat Encounter</h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="encounter-name" className="block text-sm font-medium text-base-content mb-2">Encounter Name *</label>
                  <input
                    id="encounter-name"
                    type="text"
                    required
                    value={encounterFormData.name}
                    onChange={(e) => setEncounterFormData({ ...encounterFormData, name: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Enter encounter name"
                  />
                </div>
              </div>

              <div className="card-actions justify-end">
                <button
                  type="button"
                  onClick={() => { setEncounterFormData(resetEncounterForm()); setShowCreateEncounterForm(false); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Create Encounter
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Add Participant Modal */}
        {showAddParticipantModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[80vh] overflow-y-auto">
              <h3 className="font-bold text-lg">Add Combat Participants</h3>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search characters and NPCs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-success">🧙 Characters</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredCharacters.map(character => (
                      <div key={character.id} className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{character.name}</div>
                              <div className="text-sm text-base-content/70">
                                HP: {character.hitPoints || 0} | AC: {character.armorClass || 10}
                              </div>
                            </div>
                            <button
                              onClick={() => { if (character.id) handleAddParticipant(character.id, false); }}
                              className="btn btn-success btn-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-secondary">👤 NPCs</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredNpcs.map(npc => (
                      <div key={npc.id} className="card card-compact bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{npc.name}</div>
                              <div className="text-sm text-base-content/70">
                                {npc.role || 'NPC'}
                              </div>
                            </div>
                            <button
                              onClick={() => { if (npc.id) handleAddParticipant(npc.id, true); }}
                              className="btn btn-secondary btn-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}