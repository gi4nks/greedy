import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAdventures } from '../contexts/AdventureContext';
import Page from '../components/Page';
import { useSearch } from '../hooks/useSearch';
import { useCreateSession } from '../hooks/useSessions';
import { useCreateNPC } from '../hooks/useNPCs';
import { useCreateLocation } from '../hooks/useLocations';

export default function Search(): JSX.Element {
  const [params] = useSearchParams();
  const qParam = params.get('q') || '';
  const [q, setQ] = useState(qParam);
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

  // React Query hooks
  const { data: searchResults } = useSearch(q, adv.selectedId || undefined);
  const createSessionMutation = useCreateSession();
  const createNPCMutation = useCreateNPC();
  const createLocationMutation = useCreateLocation();

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

  const renderForm = () => {
    if (formType === 'session') {
      return (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Add New Session</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="session-adventure-select" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
                <select
                  id="session-adventure-select"
                  value={sessionForm.adventure_id ?? (adv.selectedId ?? '')}
                  onChange={(e) => setSessionForm({ ...sessionForm, adventure_id: e.target.value ? Number(e.target.value) : null })}
                  className="select select-bordered w-full"
                >
                  <option value="">Global</option>
                  {adv.adventures.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="session-title-input" className="block text-sm font-medium text-base-content mb-2">Title</label>
                <input
                  id="session-title-input"
                  type="text"
                  placeholder="Title"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="session-date-input" className="block text-sm font-medium text-base-content mb-2">Date</label>
                <input
                  id="session-date-input"
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="session-notes-textarea" className="block text-sm font-medium text-base-content mb-2">Session notes (Markdown supported)</label>
                <textarea
                  id="session-notes-textarea"
                  placeholder="Session notes (Markdown supported)"
                  value={sessionForm.text}
                  onChange={(e) => setSessionForm({ ...sessionForm, text: e.target.value })}
                  className="textarea textarea-bordered w-full h-40"
                  required
                />
              </div>
              <div>
                <label htmlFor="session-preview-div" className="block text-sm font-medium text-base-content mb-2">Preview</label>
                <div id="session-preview-div" className="bg-base-200 border border-base-300 rounded-box p-4 h-40 overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{sessionForm.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary btn-sm">Add Session</button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setFormType(null); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    } else if (formType === 'npc') {
      return (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Add New NPC</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="npc-name-input" className="block text-sm font-medium text-base-content mb-2">Name</label>
                <input
                  id="npc-name-input"
                  type="text"
                  placeholder="Name"
                  value={npcForm.name}
                  onChange={(e) => setNpcForm({ ...npcForm, name: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="npc-role-input" className="block text-sm font-medium text-base-content mb-2">Role</label>
                <input
                  id="npc-role-input"
                  type="text"
                  placeholder="Role"
                  value={npcForm.role}
                  onChange={(e) => setNpcForm({ ...npcForm, role: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="npc-description-textarea" className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                  <textarea
                    id="npc-description-textarea"
                    placeholder="Description (Markdown supported)"
                    value={npcForm.description}
                    onChange={(e) => setNpcForm({ ...npcForm, description: e.target.value })}
                    className="textarea textarea-bordered w-full h-32"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="npc-preview-div" className="block text-sm font-medium text-base-content mb-2">Preview</label>
                  <div id="npc-preview-div" className="bg-base-200 border border-base-300 rounded-box p-4 h-32 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{npcForm.description}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="npc-tags-input" className="block text-sm font-medium text-base-content mb-2">Tags</label>
                <div className="flex items-center gap-2">
                  <input
                    id="npc-tags-input"
                    type="text"
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="input input-bordered flex-1"
                  />
                  <button type="button" onClick={() => void handleAddTag()} className="btn btn-secondary btn-sm">Add Tag</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {npcForm.tags.map(tag => (
                    <div key={tag} className="badge badge-primary gap-2">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="btn btn-xs btn-ghost btn-circle">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary btn-sm">Add NPC</button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setFormType(null); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    } else if (formType === 'location') {
      return (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Add New Location</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="location-name-input" className="block text-sm font-medium text-base-content mb-2">Name</label>
                <input
                  id="location-name-input"
                  type="text"
                  placeholder="Name"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location-description-textarea" className="block text-sm font-medium text-base-content mb-2">Description</label>
                  <textarea
                    id="location-description-textarea"
                    placeholder="Description"
                    value={locationForm.description}
                    onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                    className="textarea textarea-bordered w-full h-20"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location-description-preview-div" className="block text-sm font-medium text-base-content mb-2">Preview</label>
                  <div id="location-description-preview-div" className="bg-base-200 border border-base-300 rounded-box p-4 h-20 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{locationForm.description}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location-notes-textarea" className="block text-sm font-medium text-base-content mb-2">Notes (Markdown supported)</label>
                  <textarea
                    id="location-notes-textarea"
                    placeholder="Notes (Markdown supported)"
                    value={locationForm.notes}
                    onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                    className="textarea textarea-bordered w-full h-32"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location-notes-preview-div" className="block text-sm font-medium text-base-content mb-2">Preview</label>
                  <div id="location-notes-preview-div" className="bg-base-200 border border-base-300 rounded-box p-4 h-32 overflow-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{locationForm.notes}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="location-tags-input" className="block text-sm font-medium text-base-content mb-2">Tags</label>
                <div className="flex items-center gap-2">
                  <input
                    id="location-tags-input"
                    type="text"
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="input input-bordered flex-1"
                  />
                  <button type="button" onClick={() => void handleAddTag()} className="btn btn-secondary btn-sm">Add Tag</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {locationForm.tags.map(tag => (
                    <div key={tag} className="badge badge-primary gap-2">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="btn btn-xs btn-ghost btn-circle">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary btn-sm">Add Location</button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setFormType(null); }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formType === 'session') {
        const payload = { ...sessionForm, adventure_id: sessionForm.adventure_id ?? adv.selectedId };
        await createSessionMutation.mutateAsync(payload);
        setSessionForm({ title: '', date: '', text: '', adventure_id: null });
      } else if (formType === 'npc') {
        await createNPCMutation.mutateAsync(npcForm);
        setNpcForm({ name: '', role: '', description: '', tags: [] });
      } else if (formType === 'location') {
        await createLocationMutation.mutateAsync(locationForm);
        setLocationForm({ name: '', description: '', notes: '', tags: [] });
      }
      setShowCreateForm(false);
      setFormType(null);
    } catch (error) {
      console.error('Error creating item:', error);
    }
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the useSearch hook when q changes
  };

  return (
    <Page title="Search">
      <form onSubmit={onSubmit} className="mb-4">
        <label htmlFor="search-input" className="sr-only">Search all notes</label>
        <input
          id="search-input"
          className="input input-bordered w-full"
          placeholder="Search all notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      {showCreateForm && renderForm()}

      <section className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Sessions</h3>
          <button onClick={() => { void (() => { setFormType('session'); setShowCreateForm(true); })(); }} className="btn btn-primary btn-sm">Add</button>
        </div>
        {(searchResults?.sessions || []).map((s) => {
          const isCollapsed = s.id ? collapsedSessions[s.id] ?? true : false;
          return (
            <div key={s.id} className="card bg-base-100 shadow-xl hover:shadow-2xl mb-4">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleCollapseSession(s.id)}
                    className="btn btn-outline btn-primary btn-sm"
                    aria-label={isCollapsed ? '+' : '-'}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                  <h4 className="card-title text-lg">{s.title} <span className="text-sm text-base-content/70">{s.date}</span></h4>
                </div>
                {!isCollapsed && (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{s.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">NPCs</h3>
          <button onClick={() => { setFormType('npc'); setShowCreateForm(true); }} className="btn btn-primary btn-sm">Add</button>
        </div>
        {(searchResults?.npcs || []).map((n) => {
          const isCollapsed = n.id ? collapsedNpcs[n.id] ?? true : false;
          return (
            <div key={n.id} className="card bg-base-100 shadow-xl hover:shadow-2xl mb-4">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleCollapseNpc(n.id)}
                    className="btn btn-outline btn-primary btn-sm"
                    aria-label={isCollapsed ? '+' : '-'}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                  <h4 className="card-title text-lg">{n.name} <span className="text-sm text-base-content/70">{n.role}</span></h4>
                </div>
                {!isCollapsed && (
                  <>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{n.description}</ReactMarkdown>
                    </div>
                    <p className="text-sm text-base-content/70">Tags: {(n.tags || []).join(', ')}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">Locations</h3>
          <button onClick={() => { setFormType('location'); setShowCreateForm(true); }} className="btn btn-primary btn-sm">Add</button>
        </div>
        {(searchResults?.locations || []).map((l) => {
          const isCollapsed = l.id ? collapsedLocations[l.id] ?? true : false;
          return (
            <div key={l.id} className="card bg-base-100 shadow-xl hover:shadow-2xl mb-4">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleCollapseLocation(l.id)}
                    className="btn btn-outline btn-primary btn-sm"
                    aria-label={isCollapsed ? '+' : '-'}
                  >
                    {isCollapsed ? '+' : '-'}
                  </button>
                  <h4 className="card-title text-lg">{l.name}</h4>
                </div>
                {!isCollapsed && (
                  <>
                    <p className="text-base-content/70">{l.description}</p>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{l.notes}</ReactMarkdown>
                    </div>
                    <p className="text-sm text-base-content/70">Tags: {(l.tags || []).join(', ')}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </Page>
  );
}
