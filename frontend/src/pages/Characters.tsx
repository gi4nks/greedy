import React, { useState } from 'react';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { Character, CharacterForm } from '@greedy/shared';
import { useCharacterCRUD } from '../hooks/useCharacterCRUD';
import { useMagicItems, useCreateMagicItem, useAssignMagicItem, useUnassignMagicItem } from '../hooks/useMagicItems';
import { useQueryClient } from '@tanstack/react-query';
import {
  CharacterCard,
  CharacterForm as CharacterFormComponent,
  CharacterBasicTab,
  CharacterClassesTab,
  CharacterAbilitiesTab,
  CharacterCombatTab,
  CharacterItemsTab,
  CharacterSpellsTab,
  CharacterBackgroundTab,
  CharacterAssignModal
} from '../components/character';
import { EntityList } from '../components/common/EntityComponents';

export default function Characters(): JSX.Element {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const adv = useAdventures();
  const queryClient = useQueryClient();

  // Use the new generic CRUD hook
  const crud = useCharacterCRUD(adv.selectedId || undefined);

  // Additional hooks for magic items (character-specific functionality)
  const { data: magicItems = [] } = useMagicItems();
  const createMagicItemMutation = useCreateMagicItem();
  const assignMagicItemMutation = useAssignMagicItem();
  const unassignMagicItemMutation = useUnassignMagicItem();



  // Custom submit handler that works with the CRUD pattern
  const handleSubmit = async (data: CharacterForm) => {
    if (crud.state.editingId) {
      await crud.actions.handleUpdate(crud.state.editingId, data);
    } else {
      await crud.actions.handleCreate(data);
    }
  };

  // Custom edit handler to ensure proper form data initialization
  const handleEdit = (character: Character & { id: number }): void => {
    crud.actions.handleEdit(character);
  };

  // Custom delete handler
  const handleDelete = async (id: number) => {
    await crud.actions.handleDelete(id);
  };

  return (
    <Page title="Characters" toolbar={<button onClick={() => crud.actions.setShowCreateForm(true)} className="btn btn-primary btn-sm">Add</button>}>
      <EntityList
        query={crud.queries.list}
        renderItem={(character: Character & { id: number }) => {
          const isCollapsed = crud.state.collapsed[character.id] ?? true;
          return (
            <CharacterCard
              key={character.id}
              character={character}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => crud.actions.toggleCollapsed(character.id)}
              onEdit={() => handleEdit(character)}
              onDelete={() => handleDelete(character.id)}
              adventureTitle={character.adventure_id ? adv.adventures.find(a => a.id === character.adventure_id)?.title : undefined}
            />
          );
        }}
        searchTerm={crud.state.searchTerm}
        onSearchChange={crud.actions.setSearchTerm}
        emptyMessage="No characters found"
        loadingMessage="Loading characters..."
        errorMessage="Error loading characters"
      />

      {(crud.state.showCreateForm || crud.state.editingId) && (
        <CharacterFormComponent
          formData={crud.state.formData as CharacterForm}
          editingId={crud.state.editingId}
          onFormDataChange={crud.actions.setFormData}
          onSubmit={() => handleSubmit(crud.state.formData as CharacterForm)}
          onCancel={crud.actions.handleCancel}
        >
          <CharacterBasicTab
            formData={crud.state.formData as CharacterForm}
            editingId={crud.state.editingId}
            adventures={adv.adventures.filter(a => a.id !== undefined).map(a => ({ id: a.id!, title: a.title }))}
            onFormDataChange={crud.actions.setFormData}
          />
          <CharacterClassesTab
            formData={crud.state.formData as CharacterForm}
            onFormDataChange={crud.actions.setFormData}
          />
          <CharacterAbilitiesTab
            formData={crud.state.formData as CharacterForm}
            onFormDataChange={crud.actions.setFormData}
          />
          <CharacterCombatTab
            formData={crud.state.formData as CharacterForm}
            onFormDataChange={crud.actions.setFormData}
          />
          <CharacterItemsTab
            formData={crud.state.formData as CharacterForm}
            editingId={crud.state.editingId}
            magicItems={magicItems}
            onFormDataChange={crud.actions.setFormData}
            onAssignMagicItem={(itemId, characterId) => assignMagicItemMutation.mutate({ itemId, characterIds: [characterId] })}
            onUnassignMagicItem={(itemId, characterId) => unassignMagicItemMutation.mutate({ itemId, characterId })}
            onCreateMagicItem={(item) => createMagicItemMutation.mutate({
              name: item.name || 'New Item',
              description: item.description || '',
              rarity: item.rarity || 'common',
              type: item.type || 'Wondrous item',
              attunement_required: item.attunement_required || false
            })}
            onShowAssignModal={() => setShowAssignModal(true)}
          />
          <CharacterSpellsTab
            formData={crud.state.formData as CharacterForm}
            onFormDataChange={crud.actions.setFormData}
          />
          <CharacterBackgroundTab
            formData={crud.state.formData as CharacterForm}
            onFormDataChange={crud.actions.setFormData}
          />
        </CharacterFormComponent>
      )}

      <CharacterAssignModal
        isOpen={showAssignModal}
        magicItems={magicItems}
        editingId={crud.state.editingId}
        onAssign={(itemId, characterId) => {
          assignMagicItemMutation.mutate({ itemId, characterIds: [characterId] });
        }}
        onClose={() => setShowAssignModal(false)}
      />
    </Page>
  );
}
