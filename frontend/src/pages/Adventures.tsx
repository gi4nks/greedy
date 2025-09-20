import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

type Adventure = { id?: number; slug?: string; title: string; description?: string };

export default function Adventures(): JSX.Element {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [formData, setFormData] = useState<Adventure>({ title: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each adventure
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();

  // Toggle collapse for an adventure
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: ! (prev[id] ?? true) }));
  };

  useEffect(() => {
    fetchAdventures();
  }, []);

  const fetchAdventures = () => {
    axios.get('/api/adventures').then(res => setAdventures(res.data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, slug: formData.title.toLowerCase().replace(/\s+/g, '-') };
    if (editingId) {
      axios.put(`/api/adventures/${editingId}`, payload).then(() => {
        fetchAdventures();
        setFormData({ title: '', description: '' });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/adventures', payload).then(() => {
        fetchAdventures();
        setFormData({ title: '', description: '' });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (adventure: Adventure & { id: number }) => {
    setFormData({ title: adventure.title, description: adventure.description || '' });
    setEditingId(adventure.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this adventure? This will not delete associated sessions, NPCs, or locations.')) {
      axios.delete(`/api/adventures/${id}`).then(() => {
        fetchAdventures();
        // If the deleted adventure was selected, clear selection
        if (adv.selectedId === id) {
          adv.selectAdventure(null);
        }
      });
    }
  };

  const handleSelect = (id: number) => {
    adv.selectAdventure(id);
  };

  return (
    <Page title="Adventures" toolbar={<button onClick={() => setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      {(showCreateForm || editingId) && (
        <div className="mb-4">
          <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-xl justify-center">{editingId ? 'Edit Adventure' : 'Create New Adventure'}</h3>

              <div className="space-y-4">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Enter adventure title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Description and Preview */}
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                  <textarea
                    placeholder="Describe your adventure..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="textarea textarea-bordered w-full h-32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">Preview</label>
                  <div className="bg-base-100 border border-base-300 rounded-box p-4 h-32 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown children={formData.description || ''} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
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
                <button type="submit" className="btn btn-secondary btn-sm">
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
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
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
                      onClick={() => handleDelete(adventure.id)}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-6 mt-6">
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
                        <ReactMarkdown children={adventure.description || ''} />
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