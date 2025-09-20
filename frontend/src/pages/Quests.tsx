import React, { useState, useEffect, useRef } from 'react';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { useAdventures } from '../contexts/AdventureContext';
import {
  useQuests,
  useQuest,
  useCreateQuest,
  useUpdateQuest,
  useDeleteQuest,
  useAddQuestObjective,
  useUpdateQuestObjective,
  useDeleteQuestObjective
} from '../hooks/useQuests';
import { useCharacters } from '../hooks/useCharacters';
import { useSearch } from '../hooks/useSearch';
import { Quest, QuestObjective } from '@greedy/shared';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
  );
}

export const Quests: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newObjective, setNewObjective] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const adv = useAdventures();
  const tagInputRef = useRef<HTMLInputElement | null>(null);

  // React Query hooks
  const { data: quests = [], isLoading } = useQuests(adv.selectedId || undefined);
  const { data: characters = [] } = useCharacters(adv.selectedId || undefined);
  const { data: searchResults } = useSearch(searchTerm, adv.selectedId ?? undefined);

  // Mutations
  const createQuestMutation = useCreateQuest();
  const updateQuestMutation = useUpdateQuest();
  const deleteQuestMutation = useDeleteQuest();
  const addObjectiveMutation = useAddQuestObjective();
  const updateObjectiveMutation = useUpdateQuestObjective();
  const deleteObjectiveMutation = useDeleteQuestObjective();

  const [formData, setFormData] = useState<Partial<Quest>>({
    title: '',
    description: '',
    status: 'active',
    priority: 'medium',
    type: 'main',
    adventure_id: null,
    assigned_to: '',
    due_date: '',
    tags: [],
  });

  useEffect(() => {
    if (!showCreateForm && !editingId) {
      setFormData(prev => ({ ...prev, adventure_id: adv.selectedId }));
    }
  }, [adv.selectedId, showCreateForm, editingId]);

  const resetForm = () => ({
    title: '',
    description: '',
    status: 'active' as const,
    priority: 'medium' as const,
    type: 'main' as const,
    adventure_id: adv.selectedId,
    assigned_to: '',
    due_date: '',
    tags: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (editingId) {
      try {
        await updateQuestMutation.mutateAsync({
          id: editingId,
          quest: data as Omit<Quest, 'id'>
        });
        toast.push('Quest updated successfully', { type: 'success' });
        setFormData(resetForm());
        setEditingId(null);
        setShowCreateForm(false);
      } catch {
        // Error handled by React Query
        toast.push('Failed to update quest', { type: 'error' });
      }
    } else {
      try {
        await createQuestMutation.mutateAsync(data as Omit<Quest, 'id'>);
        toast.push('Quest created successfully', { type: 'success' });
        setFormData(resetForm());
        setShowCreateForm(false);
      } catch {
        // Error handled by React Query
        toast.push('Failed to create quest', { type: 'error' });
      }
    }
  };

  const handleEdit = (quest: Quest) => {
    setFormData({
      title: quest.title,
      description: quest.description,
      status: quest.status,
      priority: quest.priority,
      type: quest.type,
      adventure_id: quest.adventure_id,
      assigned_to: quest.assigned_to || '',
      due_date: quest.due_date ? quest.due_date.split('T')[0] : '',
      tags: quest.tags || [],
    });
    setEditingId(quest.id!);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    try {
      await deleteQuestMutation.mutateAsync(id);
      toast.push('Quest deleted successfully', { type: 'success' });
    } catch {
      // Error handled by React Query
      toast.push('Failed to delete quest', { type: 'error' });
    }
  };

  const handleCancel = () => {
    setFormData(resetForm());
    setEditingId(null);
    setShowCreateForm(false);
  };

  // Get full quest data with objectives when editing
  const { data: editingQuest } = useQuest(editingId || 0);

  // Objective management functions
  const addObjective = async (questId: number, description: string) => {
    try {
      await addObjectiveMutation.mutateAsync({ questId, description });
      toast.push('Objective added successfully', { type: 'success' });
      setNewObjective('');
    } catch {
      toast.push('Failed to add objective', { type: 'error' });
    }
  };

  const updateObjective = async (questId: number, objectiveId: number, description: string, completed: boolean) => {
    try {
      await updateObjectiveMutation.mutateAsync({ questId, objectiveId, description, completed });
      toast.push('Objective updated successfully', { type: 'success' });
    } catch {
      toast.push('Failed to update objective', { type: 'error' });
    }
  };

  const deleteObjective = async (questId: number, objectiveId: number) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;

    try {
      await deleteObjectiveMutation.mutateAsync({ questId, objectiveId });
      toast.push('Objective deleted successfully', { type: 'success' });
    } catch {
      toast.push('Failed to delete objective', { type: 'error' });
    }
  };

  const toggleObjectiveCompletion = async (questId: number, objectiveId: number, currentCompleted: boolean, description: string) => {
    await updateObjective(questId, objectiveId, description, !currentCompleted);
  };

  const handleAddTag = (): void => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    if (!formData.tags?.includes(v)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), v] });
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleRemoveTag = (tag: string): void => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  if (isLoading) {
    return (
      <Page title="Quests">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Quests"
      toolbar={
        <button
          onClick={() => { setShowCreateForm(true); }}
          className="btn btn-primary btn-sm"
        >
          Create
        </button>
      }
    >
      <div className="mb-6">
        <form onSubmit={(e) => { e.preventDefault(); }}>
          <input
            type="text"
            placeholder="Search Quests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-primary w-full h-9"
          />
        </form>
      </div>

      <div className="space-y-6">
        {/* Create/Edit Form */}
        {showCreateForm && (
          <form onSubmit={(e) => void handleSubmit(e)} className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h3 className="card-title text-xl justify-center">
                {editingId ? 'Edit Quest' : 'Create New Quest'}
              </h3>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="quest-title" className="block text-sm font-medium text-base-content mb-2">Title *</label>
                  <input
                    id="quest-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="Enter quest title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="quest-description" className="block text-sm font-medium text-base-content mb-2">Description *</label>
                  <textarea
                    id="quest-description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="textarea textarea-bordered w-full"
                    placeholder="Describe the quest"
                  />
                </div>

                {/* Adventure Selection - Moved to top for context setting */}
                <div>
                  <label htmlFor="quest-adventure" className="block text-sm font-medium text-base-content mb-2">Adventure *</label>
                  <select
                    id="quest-adventure"
                    value={formData.adventure_id || ''}
                    onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">Select Adventure</option>
                    {adv.adventures.map(adventure => (
                      <option key={adventure.id} value={adventure.id}>
                        {adventure.title}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-base-content/70 mt-1">Select the adventure this quest belongs to</div>
                </div>

                {/* Assigned To - Now filtered by selected adventure */}
                <div>
                  <label htmlFor="quest-assigned-to" className="block text-sm font-medium text-base-content mb-2">Assigned To</label>
                  <select
                    id="quest-assigned-to"
                    value={formData.assigned_to || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="select select-bordered w-full"
                    disabled={!formData.adventure_id}
                  >
                    <option value="">
                      {formData.adventure_id ? 'Select Character/NPC' : 'Select an adventure first'}
                    </option>
                    {characters
                      .filter(char => char.adventure_id === formData.adventure_id)
                      .map(char => (
                        <option key={char.id} value={char.name}>
                          {char.name} {char.role ? `(${char.role})` : '(Character)'}
                        </option>
                      ))}
                  </select>
                  <div className="text-xs text-base-content/70 mt-1">
                    {formData.adventure_id
                      ? `Showing characters from selected adventure (${characters.filter(char => char.adventure_id === formData.adventure_id).length} available)`
                      : 'Select an adventure above to see available characters'
                    }
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="quest-status" className="block text-sm font-medium text-base-content mb-2">Status</label>
                    <select
                      id="quest-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Quest['status'] })}
                      className="select select-bordered w-full"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="quest-priority" className="block text-sm font-medium text-base-content mb-2">Priority</label>
                    <select
                      id="quest-priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Quest['priority'] })}
                      className="select select-bordered w-full"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label htmlFor="quest-type" className="block text-sm font-medium text-base-content mb-2">Type</label>
                    <select
                      id="quest-type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Quest['type'] })}
                      className="select select-bordered w-full"
                    >
                      <option value="main">Main Quest</option>
                      <option value="side">Side Quest</option>
                      <option value="personal">Personal</option>
                      <option value="guild">Guild</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="quest-due-date" className="block text-sm font-medium text-base-content mb-2">Due Date</label>
                  <input
                    id="quest-due-date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="quest-tags" className="block text-sm font-medium text-base-content mb-2">Tags</label>
                  <div className="flex items-center gap-2">
                    <input ref={tagInputRef} id="quest-tags" type="text" placeholder="Add tag" className="input input-bordered flex-1" />
                    <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">Add Tag</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.tags || []).map(tag => (
                      <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
                    ))}
                  </div>
                </div>

              {/* Objectives Management */}
              {editingId && (
                <div>
                  <h4 className="block text-sm font-medium text-base-content mb-2">Objectives</h4>
                  <div className="space-y-2">
                    {editingQuest?.objectives.map((objective: QuestObjective) => (
                      <div key={objective.id} className="flex items-center gap-2 p-2 bg-base-200 rounded-box">
                        <input
                          type="checkbox"
                          checked={objective.completed}
                          onChange={() => { if (editingId && objective.id) void toggleObjectiveCompletion(editingId, objective.id, objective.completed, objective.description); }}
                          className="checkbox checkbox-primary"
                        />
                        <span className={`flex-1 text-sm ${objective.completed ? 'line-through text-base-content/60' : 'text-base-content'}`}>
                          {objective.description}
                        </span>
                        <button
                          onClick={() => { if (editingId && objective.id) void deleteObjective(editingId, objective.id); }}
                          className="btn btn-neutral btn-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new objective..."
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        className="input input-bordered input-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newObjective.trim() && editingId) {
                            void addObjective(editingId, newObjective.trim());
                          }
                        }}
                      />
                      <button
                        onClick={() => { if (editingId && newObjective.trim()) { void addObjective(editingId, newObjective.trim()); } }}
                        disabled={!newObjective.trim()}
                        className="btn btn-success btn-sm"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/70 mt-1">
                    Manage quest objectives. Check to mark as completed, or add new ones.
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="card-actions justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      )}

        {/* Quests List */}
        <div className="grid gap-4">
          {(searchTerm ? searchResults?.quests || [] : quests).map((quest: Quest) => {
            return (
              <div key={quest.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="card-title text-xl">{quest.title}</h3>
                      <p className="text-base-content/70 mb-3">{quest.description}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className={`badge ${
                          quest.status === 'active' ? 'badge-success' :
                          quest.status === 'completed' ? 'badge-info' :
                          quest.status === 'cancelled' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {quest.status}
                        </div>
                        <div className={`badge ${
                          quest.priority === 'critical' ? 'badge-error' :
                          quest.priority === 'high' ? 'badge-warning' :
                          quest.priority === 'medium' ? 'badge-info' :
                          'badge-success'
                        }`}>
                          {quest.priority}
                        </div>
                        <div className="badge badge-secondary">
                          {quest.type}
                        </div>
                      </div>

                      {quest.assigned_to && (
                        <p className="text-sm text-base-content/60 mb-2">Assigned to: {quest.assigned_to}</p>
                      )}

                      {quest.due_date && (
                        <p className="text-sm text-base-content/60">Due: {new Date(quest.due_date).toLocaleDateString()}</p>
                      )}

                      {/* Tags */}
                      {quest.tags && quest.tags.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {quest.tags.map(tag => (
                              <span key={tag} className="badge badge-primary">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Note: Objectives are managed in edit mode */}
                      <div className="mt-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-base-content">
                            Objectives: Edit quest to manage objectives
                          </span>
                        </div>
                      </div>

                      {/* Add New Objective - moved to edit mode */}
                      <div className="mt-4">
                        <p className="text-sm text-base-content/60">Edit quest to add/manage objectives</p>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => handleEdit(quest)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { if (quest.id) void handleDelete(quest.id); }}
                        className="btn btn-neutral btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(quests.length === 0 && !searchTerm) && (
            <div className="text-center py-12">
              <p className="text-base-content/60 text-lg">No quests found. Create your first quest to get started!</p>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};