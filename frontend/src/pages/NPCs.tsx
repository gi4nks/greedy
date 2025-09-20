import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
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
    void fetchNpcs();
  }, []);

  const fetchNpcs = () => {
    void axios.get<NPC[]>('/api/npcs').then(res => setNpcs(res.data));
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
      void axios.put(`/api/npcs/${editingId}`, data).then(() => {
        void fetchNpcs();
        setFormData({ name: '', role: '', description: '', tags: [] });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      void axios.post('/api/npcs', data).then(() => {
        void fetchNpcs();
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
      void axios.delete(`/api/npcs/${id}`).then(() => {
        void fetchNpcs();
      });
    }
  };

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get<{ npcs: NPC[] }>(`/api/search?${params.toString()}`);
    setNpcs(res.data.npcs || []);
  };

  return (
    <Page title="NPCs" toolbar={<button type="button" onPointerDown={(e) => { e.preventDefault(); setShowCreateForm(true); }} onClick={() => setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); void doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search NPCs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
          />
        </form>
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{editingId ? 'Edit NPC' : 'Create New NPC'}</h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="npc-name" className="block text-sm font-medium text-base-content mb-2">Name</label>
                <input
                  id="npc-name"
                  type="text"
                  placeholder="NPC Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="npc-role" className="block text-sm font-medium text-base-content mb-2">Role</label>
                <input
                  id="npc-role"
                  type="text"
                  placeholder="e.g., Innkeeper, Guard, Merchant, Villain"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label htmlFor="npc-adventure" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
                <select
                  id="npc-adventure"
                  value={formData.adventure_id ?? (adv.selectedId ?? '')}
                  onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
                  className="select select-bordered w-full"
                >
                  <option value="">Global NPC</option>
                  {adv.adventures.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="npc-description" className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                <textarea
                  id="npc-description"
                  placeholder="Describe the NPC's appearance, personality, background..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered w-full h-32"
                />
              </div>

              <div>
                <label htmlFor="npc-tags" className="block text-sm font-medium text-base-content mb-2">Tags</label>
                <div className="flex items-center gap-2">
                  <input ref={tagInputRef} id="npc-tags" type="text" placeholder="Add tag" className="input input-bordered flex-1" />
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
                  setFormData({ name: '', role: '', description: '', tags: [] });
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
      )}

      <div className="space-y-6">
        {npcs.map(npc => {
          const isCollapsed = npc.id ? collapsed[npc.id] ?? true : false;
          return (
            <div key={npc.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(npc.id)}
                      className="btn btn-outline btn-primary btn-sm"
                      aria-label={isCollapsed ? '+' : '-'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-2xl">{npc.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                        {npc.role && <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          {npc.role}
                        </span>}
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => { void handleEdit(npc as NPC & { id: number }); }}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { void handleDelete(npc.id); }}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-4 mt-6">
                    {npc.description && (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{npc.description}</ReactMarkdown>
                      </div>
                    )}
                    {npc.tags && npc.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <span className="text-secondary">🏷️</span>
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {npc.tags.map(tag => (
                            <div key={tag} className="badge badge-primary">
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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