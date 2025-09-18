import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Page from '../components/Page';
import { useToast } from '../components/Toast';
import { useAdventures } from '../contexts/AdventureContext';

interface Quest {
  id: number;
  adventure_id: number | null;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'main' | 'side' | 'personal' | 'guild' | 'other';
  created_at: string;
  updated_at: string;
  due_date: string | null;
  assigned_to: string | null;
  tags: string[];
}

interface QuestObjective {
  id: number;
  quest_id: number;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface Character {
  id: number;
  name: string;
  role?: string;
  adventure_id: number | null;
}

interface QuestWithObjectives extends Quest {
  objectives: QuestObjective[];
}

export const Quests: React.FC = () => {
  const [quests, setQuests] = useState<QuestWithObjectives[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newObjective, setNewObjective] = useState('');
  const [editingObjectiveId, setEditingObjectiveId] = useState<number | null>(null);
  const [editingObjectiveText, setEditingObjectiveText] = useState('');
  const toast = useToast();
  const adv = useAdventures();

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
    fetchQuests();
    fetchCharacters();
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [adv.selectedId]);

  useEffect(() => {
    if (!showCreateForm && !editingId) {
      setFormData(prev => ({ ...prev, adventure_id: adv.selectedId }));
    }
  }, [adv.selectedId, showCreateForm, editingId]);

  const fetchQuests = async () => {
    try {
      const response = await axios.get('/api/quests');
      // Fetch objectives for each quest
      const questsWithObjectives = await Promise.all(
        response.data.map(async (quest: Quest) => {
          try {
            const objectivesResponse = await axios.get(`/api/quests/${quest.id}`);
            return objectivesResponse.data;
          } catch (error) {
            console.error(`Error fetching objectives for quest ${quest.id}:`, error);
            return { ...quest, objectives: [] };
          }
        })
      );
      setQuests(questsWithObjectives);
    } catch (error) {
      console.error('Error fetching quests:', error);
      toast.push('Failed to load quests', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addObjective = async (questId: number, description: string) => {
    try {
      await axios.post(`/api/quests/${questId}/objectives`, { description });
      toast.push('Objective added successfully', { type: 'success' });
      fetchQuests();
      setNewObjective('');
    } catch (error) {
      console.error('Error adding objective:', error);
      toast.push('Failed to add objective', { type: 'error' });
    }
  };

  const updateObjective = async (questId: number, objectiveId: number, description: string, completed: boolean) => {
    try {
      await axios.put(`/api/quests/${questId}/objectives/${objectiveId}`, { description, completed });
      toast.push('Objective updated successfully', { type: 'success' });
      fetchQuests();
      setEditingObjectiveId(null);
      setEditingObjectiveText('');
    } catch (error) {
      console.error('Error updating objective:', error);
      toast.push('Failed to update objective', { type: 'error' });
    }
  };

  const deleteObjective = async (questId: number, objectiveId: number) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;

    try {
      await axios.delete(`/api/quests/${questId}/objectives/${objectiveId}`);
      toast.push('Objective deleted successfully', { type: 'success' });
      fetchQuests();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.push('Failed to delete objective', { type: 'error' });
    }
  };

  const toggleObjectiveCompletion = async (questId: number, objectiveId: number, currentCompleted: boolean, description: string) => {
    await updateObjective(questId, objectiveId, description, !currentCompleted);
  };

  const fetchCharacters = async () => {
    try {
      const response = await axios.get('/api/characters');
      setCharacters(response.data);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

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
        await axios.put(`/api/quests/${editingId}`, data);
        toast.push('Quest updated successfully', { type: 'success' });
        fetchQuests();
        setFormData(resetForm());
        setEditingId(null);
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error updating quest:', error);
        toast.push('Failed to update quest', { type: 'error' });
      }
    } else {
      try {
        await axios.post('/api/quests', data);
        toast.push('Quest created successfully', { type: 'success' });
        fetchQuests();
        setFormData(resetForm());
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error creating quest:', error);
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
    setEditingId(quest.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    try {
      await axios.delete(`/api/quests/${id}`);
      toast.push('Quest deleted successfully', { type: 'success' });
      fetchQuests();
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast.push('Failed to delete quest', { type: 'error' });
    }
  };

  const handleCancel = () => {
    setFormData(resetForm());
    setEditingId(null);
    setShowCreateForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Page title="Quests">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Quests"
      toolbar={
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          +
        </button>
      }
    >
      <div className="space-y-6">
        {/* Create/Edit Form */}
        {showCreateForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
            <h3 className="text-xl font-bold mb-6 text-center">
              {editingId ? 'Edit Quest' : 'Create New Quest'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quest title"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the quest"
                />
              </div>

              {/* Adventure Selection - Moved to top for context setting */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adventure *
                </label>
                <select
                  value={formData.adventure_id || ''}
                  onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Adventure</option>
                  {adv.adventures.map(adventure => (
                    <option key={adventure.id} value={adventure.id}>
                      {adventure.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the adventure this quest belongs to</p>
              </div>

              {/* Assigned To - Now filtered by selected adventure */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To
                </label>
                <select
                  value={formData.assigned_to || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-xs text-gray-500 mt-1">
                  {formData.adventure_id
                    ? `Showing characters from selected adventure (${characters.filter(char => char.adventure_id === formData.adventure_id).length} available)`
                    : 'Select an adventure above to see available characters'
                  }
                </p>
              </div>

              {/* Status and Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Quest['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Quest['priority'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Quest['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="main">Main Quest</option>
                  <option value="side">Side Quest</option>
                  <option value="personal">Personal</option>
                  <option value="guild">Guild</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Objectives Management */}
              {editingId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectives
                  </label>
                  <div className="space-y-2">
                    {quests.find(q => q.id === editingId)?.objectives.map((objective) => (
                      <div key={objective.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={objective.completed}
                          onChange={() => toggleObjectiveCompletion(editingId, objective.id, objective.completed, objective.description)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`flex-1 text-sm ${objective.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {objective.description}
                        </span>
                        <button
                          onClick={() => deleteObjective(editingId, objective.id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new objective..."
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newObjective.trim() && editingId) {
                            addObjective(editingId, newObjective.trim());
                          }
                        }}
                      />
                      <button
                        onClick={() => editingId && newObjective.trim() && addObjective(editingId, newObjective.trim())}
                        disabled={!newObjective.trim()}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage quest objectives. Check to mark as completed, or add new ones.
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                {editingId ? 'Update Quest' : 'Create Quest'}
              </button>
            </div>
          </form>
        )}

        {/* Quests List */}
        <div className="grid gap-4">
          {quests.map((quest) => {
            const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
            const totalObjectives = quest.objectives.length;
            const progressPercentage = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

            return (
              <div key={quest.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{quest.title}</h3>
                    <p className="text-gray-600 mb-3">{quest.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quest.status)}`}>
                        {quest.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(quest.priority)}`}>
                        {quest.priority}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {quest.type}
                      </span>
                    </div>

                    {quest.assigned_to && (
                      <p className="text-sm text-gray-500 mb-2">Assigned to: {quest.assigned_to}</p>
                    )}

                    {quest.due_date && (
                      <p className="text-sm text-gray-500">Due: {new Date(quest.due_date).toLocaleDateString()}</p>
                    )}

                    {/* Objectives Progress */}
                    {totalObjectives > 0 && (
                      <div className="mt-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Objectives: {completedObjectives}/{totalObjectives} completed
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Objectives List */}
                    {quest.objectives.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Objectives:</h4>
                        {quest.objectives.map((objective) => (
                          <div key={objective.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={objective.completed}
                              onChange={() => toggleObjectiveCompletion(quest.id, objective.id, objective.completed, objective.description)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            {editingObjectiveId === objective.id ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={editingObjectiveText}
                                  onChange={(e) => setEditingObjectiveText(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateObjective(quest.id, objective.id, editingObjectiveText, objective.completed);
                                    } else if (e.key === 'Escape') {
                                      setEditingObjectiveId(null);
                                      setEditingObjectiveText('');
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => updateObjective(quest.id, objective.id, editingObjectiveText, objective.completed)}
                                  className="text-green-600 hover:text-green-800 text-sm px-2"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingObjectiveId(null);
                                    setEditingObjectiveText('');
                                  }}
                                  className="text-gray-600 hover:text-gray-800 text-sm px-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={`flex-1 text-sm ${objective.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {objective.description}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingObjectiveId(objective.id);
                                    setEditingObjectiveText(objective.description);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm px-2"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteObjective(quest.id, objective.id)}
                                  className="text-red-600 hover:text-red-800 text-sm px-2"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Objective */}
                    <div className="mt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add new objective..."
                          value={newObjective}
                          onChange={(e) => setNewObjective(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newObjective.trim()) {
                              addObjective(quest.id, newObjective.trim());
                            }
                          }}
                        />
                        <button
                          onClick={() => newObjective.trim() && addObjective(quest.id, newObjective.trim())}
                          disabled={!newObjective.trim()}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(quest)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(quest.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {quests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No quests found. Create your first quest to get started!</p>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};