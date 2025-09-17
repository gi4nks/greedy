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
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
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
        // Refresh the context
        adv.adventures.length > 0 && window.location.reload();
      });
    } else {
      axios.post('/api/adventures', payload).then(() => {
        fetchAdventures();
        setFormData({ title: '', description: '' });
        setShowCreateForm(false);
        // Refresh the context
        window.location.reload();
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
        // Refresh the context
        window.location.reload();
      });
    }
  };

  const handleSelect = (id: number) => {
    adv.selectAdventure(id);
  };

  return (
    <Page title="Adventures" toolbar={<button onClick={() => setShowCreateForm(true)} className="bg-purple-600 text-white px-3 py-1 rounded">+</button>}>
      {(showCreateForm || editingId) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">{editingId ? 'Edit Adventure' : 'Add Adventure'}</h2>
          <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
            <div className="mb-2">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="mb-2">
              <textarea
                placeholder="Description (Markdown supported)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded h-40"
              />
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="p-2 border rounded h-40 overflow-auto bg-white prose text-gray-900">
                <ReactMarkdown children={formData.description || ''} />
              </div>
            </div>

            <div>
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">
                {editingId ? 'Update' : 'Add'} Adventure
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ title: '', description: '' });
                    setEditingId(null);
                    setShowCreateForm(false);
                  }}
                  className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
              {!editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ title: '', description: '' });
                    setShowCreateForm(false);
                  }}
                  className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {adventures.map(adventure => {
          const isEditing = editingId === adventure.id;
          const isCollapsed = adventure.id ? collapsed[adventure.id] ?? true : false;
          const isSelected = adv.selectedId === adventure.id;
          const counts = adv.counts[adventure.id || 0];

          return (
            <div
              key={adventure.id}
              className={`p-4 bg-white rounded shadow transition-all border-2 ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-transparent'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCollapse(adventure.id)}
                    className="w-7 h-7 flex items-center justify-center border rounded-full bg-gray-100 hover:bg-gray-200 mr-2"
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    <span className="text-lg">{isCollapsed ? '+' : '-'}</span>
                  </button>
                  <h3 className="text-xl font-semibold">{adventure.title}</h3>
                  {isSelected && <span className="text-sm bg-purple-600 text-white px-2 py-1 rounded">Active</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <button
                      onClick={() => handleSelect(adventure.id!)}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(adventure as Adventure & { id: number })}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(adventure.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <>
                  {counts && (
                    <div className="mb-2 text-sm text-gray-600">
                      <span className="mr-4">Sessions: {counts.sessions}</span>
                      <span className="mr-4">Characters: {counts.characters}</span>
                      <span>Locations: {counts.locations}</span>
                    </div>
                  )}
                  <div className="prose">
                    <ReactMarkdown children={adventure.description || ''} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}