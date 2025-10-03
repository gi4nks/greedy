import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useAdventures } from '../contexts/AdventureContext';
import Page from '../components/Page';
import { Session } from '@greedy/shared';
import { useSessionCRUD } from '../hooks/useSessionCRUD';
import { EntityList } from '../components/common/EntityComponents';
import ImageUpload from '../components/ImageUpload';

export default function Sessions(): JSX.Element {
  const adv = useAdventures();

  // Use the CRUD hook
  const crud = useSessionCRUD(adv.selectedId || undefined);

  // Custom render function for session items
  const renderSession = (session: Session & { id?: number }) => {
    const isCollapsed = crud.state.collapsed[session.id!] ?? true;
    return (
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => crud.actions.toggleCollapsed(session.id!)}
                className="btn btn-outline btn-primary btn-sm"
                aria-label={isCollapsed ? '+' : '-'}
              >
                {isCollapsed ? '+' : '−'}
              </button>
              <div>
                <h3 className="card-title text-2xl">{session.title}</h3>
                <div className="text-sm text-base-content/70 mt-1">{session.date}</div>
              </div>
            </div>
            <div className="card-actions">
              <button
                onClick={() => { crud.actions.handleEdit(session as Session & { id: number }); }}
                className="btn btn-secondary btn-sm"
              >
                Edit
              </button>
              <button
                onClick={() => { void crud.actions.handleDelete(session.id!); }}
                className="btn btn-neutral btn-sm"
              >
                Delete
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="mt-6 space-y-4">
              {/* Session Images Display Only */}
              {(session as any).images && Array.isArray((session as any).images) && (session as any).images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-lg">🖼️</span>
                    Images ({(session as any).images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(session as any).images.map((image: any, index: number) => (
                      <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-base-200">
                        <img 
                          src={`/api/images/sessions/${image.image_path?.split('/').pop() || 'placeholder.jpg'}`} 
                          alt={`Session image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{session.text}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom form fields for sessions
  const renderSessionForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (crud.state.editingId) {
        void crud.actions.handleUpdate(crud.state.editingId, crud.state.formData);
      } else {
        void crud.actions.handleCreate(crud.state.formData);
      }
    }} className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">{crud.state.editingId ? 'Edit' : 'Create'}</h3>

        <div className="space-y-6">
          <div>
            <label htmlFor="adventure-select" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
            <select
              id="adventure-select"
              value={crud.state.formData.adventure_id ?? (adv.selectedId ?? '')}
              onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
              className="select select-bordered w-full"
            >
              <option value="">Global</option>
              {adv.adventures.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title-input" className="block text-sm font-medium text-base-content mb-2">Title</label>
            <input
              id="title-input"
              type="text"
              placeholder="Title"
              value={crud.state.formData.title}
              onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, title: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="date-input" className="block text-sm font-medium text-base-content mb-2">Date</label>
            <input
              id="date-input"
              type="date"
              value={crud.state.formData.date}
              onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, date: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="notes-textarea" className="block text-sm font-medium text-base-content mb-2">Session notes (Markdown supported)</label>
            <textarea
              id="notes-textarea"
              placeholder="Session notes (Markdown supported)"
              value={crud.state.formData.text}
              onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, text: e.target.value })}
              className="textarea textarea-bordered w-full h-40"
              required
            />
          </div>
        </div>

        {/* Image upload (only when editing an existing session) */}
        {crud.state.editingId && (
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">Images</label>
            <ImageUpload
              entityId={crud.state.editingId}
              entityType="sessions"
              showInForm={true}
              onImagesChanged={(images) => crud.actions.setFormData({ ...crud.state.formData, images })}
            />
          </div>
        )}

        <div className="card-actions justify-end">
          <button
            type="button"
            onClick={() => {
              crud.actions.handleCancel();
            }}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            {crud.state.editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <Page title="Sessions" toolbar={<button type="button" onClick={() => crud.actions.setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <EntityList
        query={crud.queries.list}
        renderItem={renderSession}
        searchTerm={crud.state.searchTerm}
        onSearchChange={crud.actions.setSearchTerm}
        emptyMessage="No sessions found"
        loadingMessage="Loading sessions..."
        errorMessage="Error loading sessions"
      />

      {(crud.state.showCreateForm || crud.state.editingId) && renderSessionForm()}
    </Page>
  );
}
