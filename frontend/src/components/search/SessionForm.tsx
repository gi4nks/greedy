import React, { useState } from 'react';
import { MarkdownPreview } from './MarkdownPreview';

interface SessionFormProps {
  adventures: Array<{ id?: number; title: string }>;
  selectedAdventureId?: number;
  onCreate: (data: { title: string; date: string; text: string; adventure_id?: number | null }) => void;
  onCancel: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  adventures,
  selectedAdventureId,
  onCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    text: '',
    adventure_id: selectedAdventureId || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg">Add New Session</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="session-adventure-select" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
            <select
              id="session-adventure-select"
              value={formData.adventure_id ?? ''}
              onChange={(e) => setFormData({ ...formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
              className="select select-bordered w-full"
            >
              <option value="">Global</option>
              {adventures.map(a => (
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="session-date-input" className="block text-sm font-medium text-base-content mb-2">Date</label>
            <input
              id="session-date-input"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="session-notes-textarea" className="block text-sm font-medium text-base-content mb-2">Session notes (Markdown supported)</label>
            <textarea
              id="session-notes-textarea"
              placeholder="Session notes (Markdown supported)"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="textarea textarea-bordered w-full h-40"
              required
            />
          </div>
          <div className="modal-action">
            <button type="submit" className="btn btn-primary btn-sm">Add Session</button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};