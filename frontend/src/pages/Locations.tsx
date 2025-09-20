import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary badge-outline gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-circle btn-xs btn-error">×</button>
    </div>
  );
}

type Location = { id?: number; name: string; description: string; notes: string; tags?: string[] };

export default function Locations(): JSX.Element {
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState<Location>({ name: '', description: '', notes: '', tags: [] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'notes'>('description');
  // Collapsed state for each location
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const adv = useAdventures();

  const openCreateForm = (e: React.PointerEvent | React.MouseEvent) => {
    try {
      // stop default to avoid any form submit interplay
      e.preventDefault();
    } catch (err) {
      // ignore
    }
    // small debug to help diagnose flaky clicks in browser console
    // eslint-disable-next-line no-console
    console.debug('Locations: openCreateForm', e.type);
    setShowCreateForm(true);
  };

  // Toggle collapse for a location
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = () => {
    axios.get('/api/locations').then(res => setLocations(res.data));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData };
    if (editingId) {
      axios.put(`/api/locations/${editingId}`, data).then(() => {
        fetchLocations();
        setFormData({ name: '', description: '', notes: '', tags: [] });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/locations', data).then(() => {
        fetchLocations();
        setFormData({ name: '', description: '', notes: '', tags: [] });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (location: Location & { id: number }) => {
    setFormData({ name: location.name, description: location.description, notes: location.notes, tags: location.tags || [] });
    setEditingId(location.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this location?')) {
      axios.delete(`/api/locations/${id}`).then(() => {
        fetchLocations();
      });
    }
  };

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setLocations(res.data.locations || []);
  };

  return (
  <Page title="Locations" toolbar={<button type="button" onPointerDown={openCreateForm} onClick={openCreateForm as any} className="btn btn-primary btn-sm">Create</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl border border-base-300 mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{editingId ? 'Edit' : 'Create'}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered"
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
                    <label className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                    <textarea
                      placeholder="Description (Markdown supported)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="textarea textarea-bordered h-64"
                      required
                    />
                  </div>
                  <div className="bg-base-100 border border-base-300 rounded-box p-4 h-64 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown children={formData.description} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">Notes (Markdown supported)</label>
                    <textarea
                      placeholder="Notes (Markdown supported)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="textarea textarea-bordered h-64"
                      required
                    />
                  </div>
                  <div className="bg-base-100 border border-base-300 rounded-box p-4 h-64 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown children={formData.notes} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Tags</label>
                <div className="flex items-center gap-2">
                  <input ref={tagInputRef} type="text" placeholder="Add tag" className="input input-bordered flex-1" />
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
              <button type="submit" className="btn btn-secondary btn-sm">
                {editingId ? 'Update' : 'Create'}
              </button>
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
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-2xl">{location.name}</h3>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => handleEdit(location as Location & { id: number })}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
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
                      <ReactMarkdown children={location.notes} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(location.tags || []).map(t => (
                        <div key={t} className="badge badge-primary badge-outline">
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
