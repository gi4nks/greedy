import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { useSessions, useCreateSession, useUpdateSession, useDeleteSession } from '../hooks/useSessions';
import { Session } from '@greedy/shared';

export default function Timeline(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{ title: string; date: string; text: string; adventure_id?: number | null }>({ title: '', date: '', text: '', adventure_id: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Collapsed state for each session
  const [collapsed, setCollapsed] = useState<{ [id: number]: boolean }>({});
  const adv = useAdventures();

  // React Query hooks
  const { data: sessions = [], isLoading } = useSessions(adv.selectedId || undefined, searchTerm);
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();

  // Toggle collapse for a session
  const toggleCollapse = (id?: number) => {
    if (!id) return;
    setCollapsed(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adventureId = formData.adventure_id ?? adv.selectedId ?? undefined;
    const payload = { ...formData, adventure_id: adventureId };
    if (editingId) {
      updateSessionMutation.mutate(
        { id: editingId, session: payload },
        {
          onSuccess: () => {
            setFormData({ title: '', date: '', text: '', adventure_id: null });
            setEditingId(null);
            setShowCreateForm(false);
          },
          onError: (err) => {
            console.error('Error updating session:', err);
          },
        }
      );
    } else {
      createSessionMutation.mutate(payload as Omit<Session, 'id'>, {
        onSuccess: () => {
          setFormData({ title: '', date: '', text: '', adventure_id: null });
          setShowCreateForm(false);
        },
        onError: (err) => {
          console.error('Error creating session:', err);
        },
      });
    }
  };

  const handleEdit = (session: { id: number; title: string; date: string; text: string }) => {
    setFormData({ title: session.title, date: session.date, text: session.text });
    setEditingId(session.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(id, {
        onSuccess: () => {
          // Session deleted successfully
        },
        onError: (err) => {
          console.error('Error deleting session:', err);
        },
      });
    }
  };

  return (
    <Page title="Timeline" toolbar={<button onClick={() => setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search timeline..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {(showCreateForm || editingId) && (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{editingId ? 'Edit' : 'Create'}</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="timeline-adventure-select" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
                <select
                  id="timeline-adventure-select"
                  value={formData.adventure_id ?? (adv.selectedId ?? '')}
                  onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
                  className="select select-bordered w-full"
                >
                  <option value="">Global</option>
                  {adv.adventures.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="timeline-title-input" className="block text-sm font-medium text-base-content mb-2">Title</label>
                <input
                  id="timeline-title-input"
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="timeline-date-input" className="block text-sm font-medium text-base-content mb-2">Date</label>
                <input
                  id="timeline-date-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="timeline-notes-textarea" className="block text-sm font-medium text-base-content mb-2">Session notes (Markdown supported)</label>
                <textarea
                  id="timeline-notes-textarea"
                  placeholder="Session notes (Markdown supported)"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="textarea textarea-bordered w-full h-40"
                  required
                />
              </div>

              <div>
                <label htmlFor="timeline-preview-div" className="block text-sm font-medium text-base-content mb-2">Preview</label>
                <div id="timeline-preview-div" className="bg-base-200 border border-base-300 rounded-box p-4 h-40 overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{formData.text}</ReactMarkdown>
                  </div>
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
                      aria-label={isCollapsed ? '+' : '-'}
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
                    <ReactMarkdown>{session.text}</ReactMarkdown>
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
