import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
      {label}
      <button onClick={onRemove} className="ml-2 text-red-500">×</button>
    </span>
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
  <Page title="Locations" toolbar={<button type="button" onPointerDown={openCreateForm} onClick={openCreateForm as any} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">{editingId ? 'Edit Location' : 'Add New Location'}</h3>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

        {/* Tab Navigation */}
        <div className="mb-4">
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'description'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'notes'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notes
            </button>
          </div>
        </div>

          {/* Tab Content */}
          <div className="mb-4">
            {activeTab === 'description' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <textarea
                    placeholder="Description (Markdown supported)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded h-64"
                    required
                  />
                </div>
                <div className="p-2 border rounded h-64 overflow-auto bg-white prose text-gray-900">
                  <ReactMarkdown children={formData.description} />
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <textarea
                    placeholder="Notes (Markdown supported)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2 border rounded h-64"
                    required
                  />
                </div>
                <div className="p-2 border rounded h-64 overflow-auto bg-white prose text-gray-900">
                  <ReactMarkdown children={formData.notes} />
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center">
              <input ref={tagInputRef} type="text" placeholder="Add tag" className="p-2 border rounded mr-2" />
              <button type="button" onClick={handleAddTag} className="bg-gray-700 text-white px-3 py-1 rounded">Add Tag</button>
            </div>
            <div className="mt-2">
              {(formData.tags || []).map(tag => (
                <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-semibold">
              {editingId ? 'Update Location' : 'Add Location'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', description: '', notes: '', tags: [] });
                setEditingId(null);
                setShowCreateForm(false);
                setActiveTab('description');
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {locations.map(location => {
          const isCollapsed = location.id ? collapsed[location.id] ?? true : false;
          return (
            <div key={location.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(location.id)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-orange-200 rounded-full bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className="text-lg font-bold text-orange-600">{isCollapsed ? '+' : '−'}</span>
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{location.name}</h3>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(location as Location & { id: number })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 mb-2">{location.description}</p>
                  <div className="prose mb-2">
                    <ReactMarkdown children={location.notes} />
                  </div>
                  <div>
                    {(location.tags || []).map(t => (
                      <Chip key={t} label={t} onRemove={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
