import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { useToast } from '../components/Toast';
import {
  useAdventures as useAdventuresQuery,
  useCreateAdventure,
  useUpdateAdventure,
  useDeleteAdventure
} from '../hooks/useAdventures';
import { useQueryClient } from '@tanstack/react-query';
import { Adventure } from '@greedy/shared';

export default function Adventures(): JSX.Element {
  const [formData, setFormData] = useState<Adventure>({ title: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each adventure
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();
  const toast = useToast();

  const queryClient = useQueryClient();

  // React Query hooks
  const { data: adventures = [], isLoading } = useAdventuresQuery();
  const createAdventureMutation = useCreateAdventure();
  const updateAdventureMutation = useUpdateAdventure();
  const deleteAdventureMutation = useDeleteAdventure();



  // Toggle collapse for an adventure
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: ! (prev[id] ?? true) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, slug: formData.title.toLowerCase().replace(/\s+/g, '-') };
    if (editingId) {
      try {
        await updateAdventureMutation.mutateAsync({
          id: editingId,
          data: payload
        });
        toast.push('Adventure updated successfully', { type: 'success' });
        setFormData({ title: '', description: '' });
        setEditingId(null);
        setShowCreateForm(false);
      } catch {
        // Error handled by React Query
        toast.push('Failed to update adventure', { type: 'error' });
      }
    } else {
      try {
        await createAdventureMutation.mutateAsync(payload);
        toast.push('Adventure created successfully', { type: 'success' });
        setFormData({ title: '', description: '' });
        setShowCreateForm(false);
      } catch {
        // Error handled by React Query
        toast.push('Failed to create adventure', { type: 'error' });
      }
    }
  };

  const handleEdit = (adventure: Adventure & { id: number }) => {
    setFormData({ title: adventure.title, description: adventure.description || '' });
    setEditingId(adventure.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this adventure? This will not delete associated sessions, NPCs, or locations.')) {
      try {
        await deleteAdventureMutation.mutateAsync(id);
        toast.push('Adventure deleted successfully', { type: 'success' });
        // If the deleted adventure was selected, clear selection
        if (adv.selectedId === id) {
          adv.selectAdventure(null);
        }
      } catch {
        // Error handled by React Query
        toast.push('Failed to delete adventure', { type: 'error' });
      }
    }
  };

  const handleSelect = (id: number) => {
    adv.selectAdventure(id);
  };

  if (isLoading) {
    return (
      <Page title="Adventures">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Adventures" toolbar={<button onClick={() => setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      {(showCreateForm || editingId) && (
        <div className="mb-6">
          <form onSubmit={async (e) => { await handleSubmit(e); }} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl justify-center">{editingId ? 'Edit Adventure' : 'Create New Adventure'}</h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="adventure-title" className="block text-sm font-medium text-base-content mb-2">Title</label>
                  <input
                    id="adventure-title"
                    type="text"
                    placeholder="Enter adventure title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="adventure-description" className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                  <textarea
                    id="adventure-description"
                    placeholder="Describe your adventure..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="textarea textarea-bordered w-full h-32"
                  />
                </div>
              </div>

              <div className="card-actions justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ title: '', description: '' });
                    setEditingId(null);
                    setShowCreateForm(false);
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {adventures.map(adventure => {
          const isCollapsed = adventure.id ? collapsed[adventure.id] ?? true : true;
          const isSelected = adv.selectedId === adventure.id;
          const counts = adv.counts[adventure.id || 0];

          return (
            <div key={adventure.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(adventure.id)}
                      className="btn btn-outline btn-primary btn-sm"
                      aria-label={isCollapsed ? '+' : '-'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-2xl">{adventure.title}</h3>
                      {isSelected && <div className="text-sm text-base-content/70 mt-1">Selected</div>}
                    </div>
                  </div>

                  <div className="card-actions">
                    {!isSelected && (
                      <button
                        onClick={() => handleSelect(adventure.id!)}
                        className="btn btn-success btn-sm"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(adventure as Adventure & { id: number })}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(adventure.id)}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-6 mt-6">
                    {/* Adventure Images Display Only */}
                    {(adventure as any).images && Array.isArray((adventure as any).images) && (adventure as any).images.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="text-lg">🖼️</span>
                          Images ({(adventure as any).images.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {(adventure as any).images.map((image: any, index: number) => (
                            <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-base-200">
                              <img 
                                src={`/api/images/adventures/${image.image_path?.split('/').pop() || 'placeholder.jpg'}`} 
                                alt={`Adventure image ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {counts && (
                      <div className="bg-primary/10 rounded-box p-4 border border-primary/20">
                        <div className="flex items-center gap-4 text-sm text-base-content">
                          <div>Sessions: <span className="font-semibold">{counts.sessions}</span></div>
                          <div>Characters: <span className="font-semibold">{counts.characters}</span></div>
                          <div>Locations: <span className="font-semibold">{counts.locations}</span></div>
                        </div>
                      </div>
                    )}

                    <div className="bg-base-200 rounded-box p-4">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{adventure.description || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}