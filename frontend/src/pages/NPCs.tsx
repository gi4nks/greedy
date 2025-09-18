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

type NPC = {
  id?: number;
  name: string;
  role?: string;
  description?: string;
  tags?: string[];
  adventure_id?: number | null;
};

export default function NPCs(): JSX.Element {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [formData, setFormData] = useState<NPC>({ name: '', role: '', description: '', tags: [] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each NPC
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const adv = useAdventures();

  // Toggle collapse for an NPC
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => {
    fetchNpcs();
  }, []);

  const fetchNpcs = () => {
    axios.get('/api/npcs').then(res => setNpcs(res.data));
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
    const data = { ...formData, adventure_id: formData.adventure_id ?? adv.selectedId };
    if (editingId) {
      axios.put(`/api/npcs/${editingId}`, data).then(() => {
        fetchNpcs();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/npcs', data).then(() => {
        fetchNpcs();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (npc: NPC & { id: number }) => {
    setFormData({ name: npc.name, role: npc.role || '', description: npc.description || '', tags: npc.tags || [] });
    setEditingId(npc.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this NPC?')) {
      axios.delete(`/api/npcs/${id}`).then(() => {
        fetchNpcs();
      });
    }
  };

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setNpcs(res.data.npcs || []);
  };

  return (
    <Page title="NPCs" toolbar={<button type="button" onPointerDown={(e) => { e.preventDefault(); setShowCreateForm(true); }} onClick={() => setShowCreateForm(true)} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search NPCs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">{editingId ? 'Edit NPC' : 'Create New NPC'}</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              placeholder="NPC Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Role</label>
            <input
              type="text"
              placeholder="e.g., Innkeeper, Guard, Merchant, Villain"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Adventure</label>
            <select
              value={formData.adventure_id ?? (adv.selectedId ?? '')}
              onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full p-2 border rounded"
            >
              <option value="">Global NPC</option>
              {adv.adventures.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description (Markdown supported)</label>
            <textarea
              placeholder="Describe the NPC's appearance, personality, background..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded h-32"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center">
              <input ref={tagInputRef} type="text" placeholder="Add tag" className="p-2 border rounded mr-2 flex-1" />
              <button type="button" onClick={handleAddTag} className="bg-gray-700 text-white px-3 py-2 rounded">Add Tag</button>
            </div>
            <div className="mt-2">
              {(formData.tags || []).map(tag => (
                <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-semibold">
              {editingId ? 'Update NPC' : 'Create NPC'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', role: '', description: '', tags: [] });
                setEditingId(null);
                setShowCreateForm(false);
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {npcs.map(npc => {
          const isCollapsed = npc.id ? collapsed[npc.id] ?? true : false;
          return (
            <div key={npc.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(npc.id)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-purple-200 rounded-full bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-colors duration-200"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <span className="text-lg font-bold text-purple-600">{isCollapsed ? '+' : '−'}</span>
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{npc.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {npc.role && <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          {npc.role}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(npc as NPC & { id: number })}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(npc.id)}
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
                  {npc.description && (
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown children={npc.description} />
                    </div>
                  )}
                  {npc.tags && npc.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-purple-600">🏷️</span>
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {npc.tags.map(tag => (
                          <span key={tag} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}