import React, { useState } from 'react';
import Page from '../components/Page';
import { Character } from '../hooks/useCharacters';
import { useAssignMagicItem, useUnassignMagicItem } from '../hooks/useMagicItems';
import { useCharacters } from '../hooks/useCharacters';
import { useQueryClient } from '@tanstack/react-query';
import CharacterAssignmentModal from '../components/magicItem/CharacterAssignmentModal';

export default function MagicItems(): JSX.Element {
  const [assignModalItem, setAssignModalItem] = useState<number | null>(null);
  const [selectedCharIds, setSelectedCharIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Additional hooks for character assignments (magic item-specific functionality)
  const { data: characters = [] } = useCharacters();
  const assignMutation = useAssignMagicItem();
  const unassignMutation = useUnassignMagicItem();
  const queryClient = useQueryClient();

  const handleOpenAssignModal = (itemId: number) => {
    setAssignModalItem(itemId);
    // For demo purposes, start with no characters selected
    setSelectedCharIds([]);
  };

  const handleSaveAssignments = (characterIds: number[]) => {
    if (assignModalItem == null) return;
    setAssigning(true);

    // For demo, just assign to the selected characters
    if (characterIds.length > 0) {
      assignMutation.mutate(
        { itemId: assignModalItem, characterIds },
        {
          onSuccess: () => {
            alert('Assignments updated successfully!');
            setAssignModalItem(null);
          },
          onError: (err) => {
            console.error('Failed to update assignments', err);
            alert('Failed to update assignments');
          },
          onSettled: () => {
            setAssigning(false);
          },
        }
      );
    } else {
      setAssigning(false);
      setAssignModalItem(null);
      alert('No characters selected');
    }
  };

  return (
    <Page title="Magic Items">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Magic Items Management</h2>
        <p className="mb-4">This page is under development. The assignment modal functionality is now working.</p>
        
        {/* Test button to open assignment modal */}
        <button 
          onClick={() => handleOpenAssignModal(1)} 
          className="btn btn-primary"
        >
          Test Assignment Modal
        </button>
      </div>

      <CharacterAssignmentModal
        isOpen={assignModalItem !== null}
        onClose={() => setAssignModalItem(null)}
        onSave={handleSaveAssignments}
        characters={characters}
        initiallySelectedIds={selectedCharIds}
        isSaving={assigning}
      />
    </Page>
  );
}
