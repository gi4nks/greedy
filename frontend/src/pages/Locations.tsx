import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { useToast } from '../components/Toast';
import { Location } from '@greedy/shared';
import { useLocationCRUD } from '../hooks/useLocationCRUD';
import { EntityList } from '../components/common/EntityComponents';

export default function Locations(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'description' | 'notes'>('description');
  const adv = useAdventures();
  const toast = useToast();

  // Use the CRUD hook
  const crud = useLocationCRUD(adv.selectedId || undefined);

  // Custom render function for location items
  const renderLocation = (location: Location & { id: number }) => {
    const isCollapsed = crud.state.collapsed[location.id] ?? true;
    return (
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => crud.actions.toggleCollapsed(location.id)}
                className="btn btn-outline btn-primary btn-sm"
                aria-label={isCollapsed ? '+' : '-'}
              >
                {isCollapsed ? '+' : '−'}
              </button>
              <div>
                <h3 className="card-title text-2xl">{location.name}</h3>
              </div>
            </div>
            <div className="card-actions">
              <button
                onClick={() => crud.actions.handleEdit(location)}
                className="btn btn-secondary btn-sm"
              >
                Edit
              </button>
              <button
                onClick={() => crud.actions.handleDelete(location.id)}
                className="btn btn-neutral btn-sm"
              >
                Delete
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="space-y-4 mt-6">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{location.description || ''}</ReactMarkdown>
              </div>
              <div className="prose">
                <ReactMarkdown>{location.notes || ''}</ReactMarkdown>
              </div>
              <div className="flex flex-wrap gap-2">
                {(location.tags || []).map(t => (
                  <div key={t} className="badge badge-primary">
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom form fields for locations
  const renderLocationForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (crud.state.editingId) {
        crud.actions.handleUpdate(crud.state.editingId, crud.state.formData);
      } else {
        crud.actions.handleCreate(crud.state.formData);
      }
    }} className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title text-xl justify-center">{crud.state.editingId ? 'Edit' : 'Create'}</h3>

        <div className="space-y-6">
          <div>
            <label htmlFor="location-name" className="block text-sm font-medium text-base-content mb-2">Name</label>
            <input
              id="location-name"
              type="text"
              placeholder="Name"
              value={crud.state.formData.name}
              onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, name: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="location-adventure" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
            <select
              id="location-adventure"
              value={crud.state.formData.adventure_id || ''}
              onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
              className="select select-bordered w-full"
            >
              <option value="">No Adventure (Global Location)</option>
              {adv.adventures.map(adventure => (
                <option key={adventure.id} value={adventure.id}>
                  {adventure.title}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="tabs tabs-boxed">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`tab ${activeTab === 'description' ? 'tab-active' : ''}`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`tab ${activeTab === 'notes' ? 'tab-active' : ''}`}
            >
              Notes
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="location-description" className="block text-sm font-medium text-base-content mb-2">Description (Markdown supported)</label>
                <textarea
                  id="location-description"
                  placeholder="Description (Markdown supported)"
                  value={crud.state.formData.description || ''}
                  onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, description: e.target.value })}
                  className="textarea textarea-bordered w-full h-48"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="location-notes" className="block text-sm font-medium text-base-content mb-2">Notes (Markdown supported)</label>
                <textarea
                  id="location-notes"
                  placeholder="Notes (Markdown supported)"
                  value={crud.state.formData.notes || ''}
                  onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, notes: e.target.value })}
                  className="textarea textarea-bordered w-full h-48"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="location-tags" className="block text-sm font-medium text-base-content mb-2">Tags</label>
            <div className="flex items-center gap-2">
              <input id="location-tags" type="text" placeholder="Add tag" className="input input-bordered flex-1" />
              <button type="button" onClick={() => {
                const input = document.getElementById('location-tags') as HTMLInputElement;
                const v = (input?.value || '').trim();
                if (v && !crud.state.formData.tags?.includes(v)) {
                  crud.actions.setFormData({
                    ...crud.state.formData,
                    tags: [...(crud.state.formData.tags || []), v]
                  });
                  input.value = '';
                }
              }} className="btn btn-secondary btn-sm">Add Tag</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(crud.state.formData.tags || []).map(tag => (
                <div key={tag} className="badge badge-primary gap-2">
                  {tag}
                  <button onClick={() => crud.actions.setFormData({
                    ...crud.state.formData,
                    tags: (crud.state.formData.tags || []).filter(t => t !== tag)
                  })} className="btn btn-xs btn-ghost btn-circle">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-actions justify-end">
          <button
            type="button"
            onClick={() => {
              crud.actions.handleCancel();
              setActiveTab('description');
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
    <Page title="Locations" toolbar={<button type="button" onClick={() => crud.actions.setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <EntityList
        query={crud.queries.list}
        renderItem={renderLocation}
        searchTerm={crud.state.searchTerm}
        onSearchChange={crud.actions.setSearchTerm}
        emptyMessage="No locations found"
        loadingMessage="Loading locations..."
        errorMessage="Error loading locations"
      />

      {(crud.state.showCreateForm || crud.state.editingId) && renderLocationForm()}
    </Page>
  );
}
