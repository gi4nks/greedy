import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { useToast } from '../components/Toast';
import { Location } from '@greedy/shared';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation
} from '../hooks/useLocations';
import { useSearch } from '../hooks/useSearch';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
  );
}

export default function Locations(): JSX.Element {
  const [formData, setFormData] = useState<Location>({ name: '', description: '', notes: '', tags: [] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'notes'>('description');
  // Collapsed state for each location
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const adv = useAdventures();
  const toast = useToast();

  // React Query hooks
  const { data: locations = [], isLoading } = useLocations(adv.selectedId || undefined);
  const { data: searchResults } = useSearch(searchTerm, adv.selectedId || undefined);
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();

  // Use search results if there's a search term, otherwise use all locations
  const displayLocations = searchTerm ? (searchResults?.locations || []) : locations;

  const openCreateForm = (e: React.PointerEvent | React.MouseEvent) => {
    try {
      // stop default to avoid any form submit interplay
      e.preventDefault();
    } catch {
      // ignore
    }
    setShowCreateForm(true);
  };

  // Toggle collapse for a location
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    // Remove id and adventure_id from the payload
    const { id, adventure_id, ...payload } = data;
    if (editingId) {
      updateLocationMutation.mutate(
        { id: editingId, location: payload },
        {
          onSuccess: () => {
            toast.push('Location updated');
            setFormData({ name: '', description: '', notes: '', tags: [] });
            setEditingId(null);
            setShowCreateForm(false);
          },
          onError: (err) => {
            console.error('Error updating location:', err);
            toast.push('Failed to update location', { type: 'error' });
          },
        }
      );
    } else {
      createLocationMutation.mutate(payload, {
        onSuccess: () => {
          toast.push('Location created');
          setFormData({ name: '', description: '', notes: '', tags: [] });
          setShowCreateForm(false);
        },
        onError: (err) => {
          console.error('Error creating location:', err);
          toast.push('Failed to create location', { type: 'error' });
        },
      });
    }
  };

  const handleAddTag = () => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    if (!formData.tags?.includes(v)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), v] });
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: (formData.tags || []).filter(t => t !== tag) });
  };

  const handleEdit = (location: Location & { id: number }) => {
    setFormData({ name: location.name, description: location.description, notes: location.notes, tags: location.tags || [] });
    setEditingId(location.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this location?')) {
      deleteLocationMutation.mutate(id, {
        onSuccess: () => {
          toast.push('Location deleted');
        },
        onError: (err) => {
          console.error('Error deleting location:', err);
          toast.push('Failed to delete location', { type: 'error' });
        },
      });
    }
  };

  return (
  <Page title="Locations" toolbar={<button type="button" onPointerDown={openCreateForm} onClick={() => void openCreateForm} className="btn btn-primary btn-sm">Create</button>}>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={(e) => void handleSubmit(e)} className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{editingId ? 'Edit' : 'Create'}</h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="location-name" className="block text-sm font-medium text-base-content mb-2">Name</label>
                <input
                  id="location-name"
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              {/* Tab Navigation */}
              <div className="tabs tabs-boxed">
                <button
                  type="button"
                  onClick={() => setActiveTab('description')}
                  className={`tab ${activeTab === 'description' ? 'tab-active' : ''}`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`tab ${activeTab === 'notes' ? 'tab-active' : ''}`}
                >
                  Notes
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'description' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location-description" className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                    <textarea
                      id="location-description"
                      placeholder="Description (Markdown supported)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="textarea textarea-bordered h-64"
                      required
                    />
                  </div>
                  <div className="bg-base-200 border border-base-300 rounded-box p-4 h-64 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{formData.description}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location-notes" className="block text-sm font-medium text-base-content mb-2">Notes (Markdown supported)</label>
                    <textarea
                      id="location-notes"
                      placeholder="Notes (Markdown supported)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="textarea textarea-bordered h-64"
                      required
                    />
                  </div>
                  <div className="bg-base-200 border border-base-300 rounded-box p-4 h-64 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{formData.notes}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="location-tags" className="block text-sm font-medium text-base-content mb-2">Tags</label>
                <div className="flex items-center gap-2">
                  <input id="location-tags" ref={tagInputRef} type="text" placeholder="Add tag" className="input input-bordered flex-1" />
                  <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">Add Tag</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.tags || []).map(tag => (
                    <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="card-actions justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', description: '', notes: '', tags: [] });
                  setEditingId(null);
                  setShowCreateForm(false);
                  setActiveTab('description');
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
      )}

      <div className="space-y-6">
        {locations.map(location => {
          const isCollapsed = location.id ? collapsed[location.id] ?? true : false;
          return (
            <div key={location.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(location.id)}
                      className="btn btn-outline btn-primary btn-sm"
                      aria-label={isCollapsed ? '+' : '-'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-2xl">{location.name}</h3>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => void handleEdit(location as Location & { id: number })}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(location.id)}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-4 mt-6">
                    <p className="text-base-content/70 mb-2">{location.description}</p>
                    <div className="prose">
                      <ReactMarkdown>{location.notes}</ReactMarkdown>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(location.tags || []).map(t => (
                        <div key={t} className="badge badge-primary">
                          {t}
                        </div>
                      ))}
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
