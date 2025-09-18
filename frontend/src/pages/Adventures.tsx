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
    <Page title="Adventures" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      {(showCreateForm || editingId) && (
        <div className="mb-6">
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
            <h3 className="text-xl font-bold mb-4 text-center">{editingId ? 'Edit Adventure' : 'Create New Adventure'}</h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (Markdown supported)</label>
                <textarea
                  placeholder="Description (Markdown supported)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded h-40"
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Preview</h4>
                <div className="p-2 border rounded h-40 overflow-auto bg-white prose text-gray-900">
                  <ReactMarkdown children={formData.description || ''} />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-semibold">
                  {editingId ? 'Update Adventure' : 'Create Adventure'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ title: '', description: '' });
                    setEditingId(null);
                    setShowCreateForm(false);
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded"
                >
                  Cancel
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
            <div key={adventure.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(adventure.id)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-orange-200 rounded-full bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className="text-lg font-bold text-orange-600">{isCollapsed ? '+' : '−'}</span>
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{adventure.title}</h3>
                      {isSelected && <div className="text-sm text-gray-600 mt-1">Selected</div>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isSelected && (
                      <button
                        onClick={() => handleSelect(adventure.id!)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(adventure as Adventure & { id: number })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(adventure.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-6 space-y-6">
                  {counts && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        <div>Sessions: <span className="font-semibold">{counts.sessions}</span></div>
                        <div>Characters: <span className="font-semibold">{counts.characters}</span></div>
                        <div>Locations: <span className="font-semibold">{counts.locations}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown children={adventure.description || ''} />
                    </div>
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