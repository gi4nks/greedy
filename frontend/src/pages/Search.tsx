import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAdventures } from '../contexts/AdventureContext';
import Page from '../components/Page';

export default function Search(): JSX.Element {
  const [params] = useSearchParams();
  const qParam = params.get('q') || '';
  const [q, setQ] = useState(qParam);
  const [results, setResults] = useState({ sessions: [], npcs: [], locations: [] } as any);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formType, setFormType] = useState<'session' | 'npc' | 'location' | null>(null);
  const [sessionForm, setSessionForm] = useState({ title: '', date: '', text: '', adventure_id: null as number | null });
  const [npcForm, setNpcForm] = useState({ name: '', role: '', description: '', tags: [] as string[] });
  const [locationForm, setLocationForm] = useState({ name: '', description: '', notes: '', tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');
  // Collapsed states for each type
  const [collapsedSessions, setCollapsedSessions] = useState<{ [id: number]: boolean }>({});
  const [collapsedNpcs, setCollapsedNpcs] = useState<{ [id: number]: boolean }>({});
  const [collapsedLocations, setCollapsedLocations] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();

  // Toggle functions
  const toggleCollapseSession = (id?: number) => {
    if (!id) return;
    setCollapsedSessions(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const toggleCollapseNpc = (id?: number) => {
    if (!id) return;
    setCollapsedNpcs(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const toggleCollapseLocation = (id?: number) => {
    if (!id) return;
    setCollapsedLocations(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => {
    if (qParam) doSearch(qParam);
  }, [qParam]);

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setResults(res.data);
  };

  const renderForm = () => {
    if (formType === 'session') {
      return (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Add New Session</h3>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adventure</label>
            <select
              value={sessionForm.adventure_id ?? (adv.selectedId ?? '')}
              onChange={(e) => setSessionForm({ ...sessionForm, adventure_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full p-2 border rounded"
            >
              <option value="">Global</option>
              {adv.adventures.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Title"
              value={sessionForm.title}
              onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="date"
              value={sessionForm.date}
              onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-2">
            <textarea
              placeholder="Session notes (Markdown supported)"
              value={sessionForm.text}
              onChange={(e) => setSessionForm({ ...sessionForm, text: e.target.value })}
              className="w-full p-2 border rounded h-40"
              required
            />
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Preview</h4>
            <div className="p-2 border rounded h-40 overflow-auto bg-white prose text-gray-900">
              <ReactMarkdown>{sessionForm.text}</ReactMarkdown>
            </div>
          </div>
          <div>
            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded">Add Session</button>
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setFormType(null); }}
              className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    } else if (formType === 'npc') {
      return (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Add New NPC</h3>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Name"
              value={npcForm.name}
              onChange={(e) => setNpcForm({ ...npcForm, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Role"
              value={npcForm.role}
              onChange={(e) => setNpcForm({ ...npcForm, role: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-2 grid grid-cols-2 gap-4">
            <textarea
              placeholder="Description (Markdown supported)"
              value={npcForm.description}
              onChange={(e) => setNpcForm({ ...npcForm, description: e.target.value })}
              className="w-full p-2 border rounded h-32"
              required
            />
            <div>
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="p-2 border rounded h-32 overflow-auto bg-white prose text-gray-900">
                <ReactMarkdown>{npcForm.description}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="p-2 border rounded mr-2"
              />
              <button type="button" onClick={handleAddTag} className="bg-gray-700 text-white px-3 py-1 rounded">Add Tag</button>
            </div>
            <div className="mt-2">
              {npcForm.tags.map(tag => (
                <span key={tag} className="inline-flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded">Add NPC</button>
          <button
            type="button"
            onClick={() => { setShowCreateForm(false); setFormType(null); }}
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </form>
      );
    } else if (formType === 'location') {
      return (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 text-center">Add New Location</h3>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Name"
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-2 grid grid-cols-2 gap-4">
            <textarea
              placeholder="Description"
              value={locationForm.description}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
              className="w-full p-2 border rounded h-20"
              required
            />
            <div>
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="p-2 border rounded h-20 overflow-auto bg-white prose text-gray-900">
                <ReactMarkdown>{locationForm.description}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-4">
            <textarea
              placeholder="Notes (Markdown supported)"
              value={locationForm.notes}
              onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
              className="w-full p-2 border rounded h-32"
              required
            />
            <div>
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="p-2 border rounded h-32 overflow-auto bg-white prose text-gray-900">
                <ReactMarkdown>{locationForm.notes}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="p-2 border rounded mr-2"
              />
              <button type="button" onClick={handleAddTag} className="bg-gray-700 text-white px-3 py-1 rounded">Add Tag</button>
            </div>
            <div className="mt-2">
              {locationForm.tags.map(tag => (
                <span key={tag} className="inline-flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2 mb-2">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded">Add Location</button>
          <button
            type="button"
            onClick={() => { setShowCreateForm(false); setFormType(null); }}
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </form>
      );
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formType === 'session') {
      const payload = { ...sessionForm, adventure_id: sessionForm.adventure_id ?? adv.selectedId };
      await axios.post('/api/sessions', payload);
      setSessionForm({ title: '', date: '', text: '', adventure_id: null });
    } else if (formType === 'npc') {
      await axios.post('/api/npcs', npcForm);
      setNpcForm({ name: '', role: '', description: '', tags: [] });
    } else if (formType === 'location') {
      await axios.post('/api/locations', locationForm);
      setLocationForm({ name: '', description: '', notes: '', tags: [] });
    }
    setShowCreateForm(false);
    setFormType(null);
    // Optionally refresh search
    if (q.trim()) await doSearch(q);
  };

  const handleAddTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (formType === 'npc' && !npcForm.tags.includes(v)) {
      setNpcForm({ ...npcForm, tags: [...npcForm.tags, v] });
    } else if (formType === 'location' && !locationForm.tags.includes(v)) {
      setLocationForm({ ...locationForm, tags: [...locationForm.tags, v] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    if (formType === 'npc') {
      setNpcForm({ ...npcForm, tags: npcForm.tags.filter(t => t !== tag) });
    } else if (formType === 'location') {
      setLocationForm({ ...locationForm, tags: locationForm.tags.filter(t => t !== tag) });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    await doSearch(q);
  };

  return (
    <Page title="Search">
      <form onSubmit={onSubmit} className="mb-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="Search all notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      {showCreateForm && renderForm()}

      <section className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Sessions</h3>
          <button onClick={() => { setFormType('session'); setShowCreateForm(true); }} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>
        </div>
        {(results.sessions || []).map((s: any) => {
          const isCollapsed = s.id ? collapsedSessions[s.id] ?? true : false;
          return (
            <div key={s.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleCollapseSession(s.id)}
                  className="w-8 h-8 border-2 border-orange-200 rounded-full bg-orange-50 flex items-center justify-center text-sm hover:bg-orange-100"
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? '+' : '-'}
                </button>
                <h4 className="font-semibold">{s.title} <span className="text-sm text-gray-500">{s.date}</span></h4>
              </div>
              {!isCollapsed && (
                <div className="prose"><ReactMarkdown>{s.text}</ReactMarkdown></div>
              )}
            </div>
          );
        })}
      </section>

      <section className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">NPCs</h3>
          <button onClick={() => { setFormType('npc'); setShowCreateForm(true); }} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>
        </div>
        {(results.npcs || []).map((n: any) => {
          const isCollapsed = n.id ? collapsedNpcs[n.id] ?? true : false;
          return (
            <div key={n.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleCollapseNpc(n.id)}
                  className="w-8 h-8 border-2 border-orange-200 rounded-full bg-orange-50 flex items-center justify-center text-sm hover:bg-orange-100"
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? '+' : '-'}
                </button>
                <h4 className="font-semibold">{n.name} <span className="text-sm text-gray-500">{n.role}</span></h4>
              </div>
              {!isCollapsed && (
                <>
                  <div className="prose"><ReactMarkdown>{n.description}</ReactMarkdown></div>
                  <p className="text-sm text-gray-500">Tags: {(n.tags || []).join(', ')}</p>
                </>
              )}
            </div>
          );
        })}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Locations</h3>
          <button onClick={() => { setFormType('location'); setShowCreateForm(true); }} className="bg-orange-600 text-white px-3 py-1 rounded">+</button>
        </div>
        {(results.locations || []).map((l: any) => {
          const isCollapsed = l.id ? collapsedLocations[l.id] ?? true : false;
          return (
            <div key={l.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleCollapseLocation(l.id)}
                  className="w-8 h-8 border-2 border-orange-200 rounded-full bg-orange-50 flex items-center justify-center text-sm hover:bg-orange-100"
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? '+' : '-'}
                </button>
                <h4 className="font-semibold">{l.name}</h4>
              </div>
              {!isCollapsed && (
                <>
                  <p className="text-gray-600">{l.description}</p>
                  <div className="prose"><ReactMarkdown>{l.notes}</ReactMarkdown></div>
                  <p className="text-sm text-gray-500">Tags: {(l.tags || []).join(', ')}</p>
                </>
              )}
            </div>
          );
        })}
      </section>
    </Page>
  );
}
