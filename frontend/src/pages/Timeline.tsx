import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';

export default function Timeline(): JSX.Element {
  const [sessions, setSessions] = useState<{ id?: number; title: string; date: string; text: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{ title: string; date: string; text: string; adventure_id?: number | null }>({ title: '', date: '', text: '', adventure_id: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each session
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();

  // Toggle collapse for a session
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const doSearch = async (term: string) => {
    const params = new URLSearchParams();
    params.set('q', term);
    if (adv.selectedId) params.set('adventure', String(adv.selectedId));
    const res = await axios.get(`/api/search?${params.toString()}`);
    setSessions((res.data.sessions || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, adventure_id: formData.adventure_id ?? adv.selectedId };
    if (editingId) {
      axios.put(`/api/sessions/${editingId}`, payload).then(() => {
        fetchSessions();
        setFormData({ title: '', date: '', text: '', adventure_id: null });
        setEditingId(null);
        setShowCreateForm(false);
      });
    } else {
      axios.post('/api/sessions', payload).then(() => {
        fetchSessions();
        setFormData({ title: '', date: '', text: '', adventure_id: null });
        setShowCreateForm(false);
      });
    }
  };

  const handleEdit = (session: { id: number; title: string; date: string; text: string }) => {
    setFormData({ title: session.title, date: session.date, text: session.text });
    setEditingId(session.id);
    setShowCreateForm(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this session?')) {
      axios.delete(`/api/sessions/${id}`).then(() => {
        fetchSessions();
      });
    }
  };

  const fetchSessions = () => {
    axios.get('/api/sessions').then(res => {
      const sorted = res.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSessions(sorted);
    });
  };

  return (
    <Page title="Timeline" toolbar={<button onClick={() => setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <div className="mb-4">
        <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
          <input
            type="text"
            placeholder="Search timeline..."
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
                <label className="block text-sm font-medium text-base-content mb-2">Adventure</label>
                <select
                  value={formData.adventure_id ?? (adv.selectedId ?? '')}
                  onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
                  className="select select-bordered"
                >
                  <option value="">Global</option>
                  {adv.adventures.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Session notes (Markdown supported)</label>
                <textarea
                  placeholder="Session notes (Markdown supported)"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="textarea textarea-bordered h-40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Preview</label>
                <div className="p-2 border rounded h-40 overflow-auto bg-base-100 prose text-base-content">
                  <ReactMarkdown children={formData.text} />
                </div>
              </div>
            </div>

            <div className="card-actions justify-end">
              <button type="submit" className="btn btn-primary btn-sm">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ title: '', date: '', text: '', adventure_id: null });
                  setEditingId(null);
                  setShowCreateForm(false);
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
        {sessions.map(session => {
          const isCollapsed = session.id ? collapsed[session.id] ?? true : false;
          return (
            <div key={session.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCollapse(session.id)}
                      className="btn btn-outline btn-success btn-sm"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                    <div>
                      <h3 className="card-title text-2xl">{session.title} - {session.date}</h3>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => handleEdit(session as { id: number; title: string; date: string; text: string })}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown children={session.text} />
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
