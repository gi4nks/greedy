import React, { useState, useEffect } from 'react';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { useAdventures } from '../contexts/AdventureContext';
import {
  useAddQuestObjective,
  useUpdateQuestObjective,
  useDeleteQuestObjective
} from '../hooks/useQuests';
import { useCharacters } from '../hooks/useCharacters';
import { useSearch } from '../hooks/useSearch';
import { Quest, QuestForm, SearchResult } from '@greedy/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useQuestCRUD } from '../hooks/useQuestCRUD';
import { EntityList } from '../components/common/EntityComponents';
import {
  QuestList,
  QuestForm as QuestFormComponent
} from '../components/quest';

export const Quests: React.FC = () => {
  const toast = useToast();
  const adv = useAdventures();
  const queryClient = useQueryClient();

  // Use the CRUD hook
  const crud = useQuestCRUD(adv.selectedId || undefined);

  // Additional hooks for quest-specific functionality
  const { data: characters = [] } = useCharacters(adv.selectedId || undefined);
  const { data: searchResults, isError: searchError } = useSearch(crud.state.searchTerm, adv.selectedId ?? undefined) as { data: SearchResult | undefined; isError: boolean };

  // Mutations for objectives
  const addObjectiveMutation = useAddQuestObjective();
  const updateObjectiveMutation = useUpdateQuestObjective();
  const deleteObjectiveMutation = useDeleteQuestObjective();



  // Custom submit handler that works with the CRUD pattern
  const handleSubmit = async (data: QuestForm) => {
    if (crud.state.editingId) {
      await crud.actions.handleUpdate(crud.state.editingId, data);
    } else {
      await crud.actions.handleCreate(data);
    }
  };

  // Custom edit handler
  const handleEdit = (quest: Quest) => {
    if (quest.id) {
      crud.actions.handleEdit(quest as Quest & { id: number });
    }
  };

  // Custom delete handler
  const handleDelete = async (id: number) => {
    await crud.actions.handleDelete(id);
  };

  // Get full quest data with objectives when editing
  const { data: editingQuest } = crud.queries.item(crud.state.editingId || 0);

  // Objective management functions
  const addObjective = async (description: string) => {
    if (!crud.state.editingId) return;
    try {
      await addObjectiveMutation.mutateAsync({ questId: crud.state.editingId, description });
      toast.push('Objective added successfully', { type: 'success' });
    } catch {
      toast.push('Failed to add objective', { type: 'error' });
    }
  };

  const updateObjective = async (objectiveId: number, description: string, completed: boolean) => {
    if (!crud.state.editingId) return;
    try {
      await updateObjectiveMutation.mutateAsync({ questId: crud.state.editingId, objectiveId, description, completed });
      toast.push('Objective updated successfully', { type: 'success' });
    } catch {
      toast.push('Failed to update objective', { type: 'error' });
    }
  };

  const deleteObjective = async (objectiveId: number) => {
    if (!crud.state.editingId) return;
    if (!confirm('Are you sure you want to delete this objective?')) return;

    try {
      await deleteObjectiveMutation.mutateAsync({ questId: crud.state.editingId, objectiveId });
      toast.push('Objective deleted successfully', { type: 'success' });
    } catch {
      toast.push('Failed to delete objective', { type: 'error' });
    }
  };

  return (
    <Page
      title="Quests"
      toolbar={
        <button
          onClick={() => crud.actions.setShowCreateForm(true)}
          className="btn btn-primary btn-sm"
        >
          Create
        </button>
      }
    >
      <EntityList
        query={crud.queries.list}
        renderItem={(quest: Quest & { id: number }) => {
          return (
            <QuestList
              quests={[quest]}
              searchTerm=""
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          );
        }}
        searchTerm={crud.state.searchTerm}
        onSearchChange={crud.actions.setSearchTerm}
        emptyMessage="No quests found"
        loadingMessage="Loading quests..."
        errorMessage="Error loading quests"
      />

      {(crud.state.showCreateForm || crud.state.editingId) && (
                <QuestFormComponent
          formData={crud.state.formData as QuestForm}
          editingId={crud.state.editingId}
          adventures={adv.adventures}
          characters={characters}
          onFormDataChange={crud.actions.setFormData}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(crud.state.formData as QuestForm);
          }}
          onCancel={crud.actions.handleCancel}
          onAddObjective={addObjective}
          onUpdateObjective={updateObjective}
          onDeleteObjective={deleteObjective}
        />
      )}
    </Page>
  );
};