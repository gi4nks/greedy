import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Page from '../components/Page';
import { useAdventures } from '../contexts/AdventureContext';
import { NPC } from '@greedy/shared';
import { useNPCCrud } from '../hooks/useNPCCrud';
import { EntityList } from '../components/common/EntityComponents';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="badge badge-primary gap-2">
      {label}
      <button onClick={onRemove} className="btn btn-xs btn-ghost btn-circle">×</button>
    </div>
  );
}

export default function NPCs(): JSX.Element {
  const [tagInputRef] = useState(useRef<HTMLInputElement | null>(null));
  const adv = useAdventures();

  // Use the new generic CRUD hook
  const crud = useNPCCrud(adv.selectedId || undefined);

  const handleAddTag = () => {
    const v = (tagInputRef.current?.value || '').trim();
    if (!v) return;
    const currentTags = crud.state.formData.tags || [];
    if (!currentTags.includes(v)) {
      crud.actions.setFormData({ ...crud.state.formData, tags: [...currentTags, v] });
    }
    if (tagInputRef.current) tagInputRef.current.value = '';
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = crud.state.formData.tags || [];
    crud.actions.setFormData({ ...crud.state.formData, tags: currentTags.filter((t: string) => t !== tag) });
  };

  // Custom form submit handler that works with CRUD
  const handleSubmit = async (data: Partial<NPC>) => {
    const payload = { ...data, adventure_id: data.adventure_id ?? adv.selectedId };
    if (crud.state.editingId) {
      await crud.actions.handleUpdate(crud.state.editingId, payload);
    } else {
      await crud.actions.handleCreate(payload);
    }
  };

  // Custom edit handler
  const handleEdit = (npc: NPC & { id: number }) => {
    crud.actions.handleEdit(npc);
  };

  // Custom delete handler
  const handleDelete = async (id: number) => {
    await crud.actions.handleDelete(id);
  };

  return (
    <Page title="NPCs" toolbar={<button type="button" onClick={() => crud.actions.setShowCreateForm(true)} className="btn btn-primary btn-sm">Create</button>}>
      <EntityList
        query={crud.queries.list}
        renderItem={(npc: NPC & { id: number }) => {
          const isCollapsed = crud.state.collapsed[npc.id] ?? true;
          return (
            <div key={npc.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => crud.actions.toggleCollapsed(npc.id)}
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
                      onClick={() => handleEdit(npc)}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(npc.id)}
                      className="btn btn-neutral btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-4 mt-6">
                    {/* NPC Images Display Only */}
                    {(npc as any).images && Array.isArray((npc as any).images) && (npc as any).images.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="text-lg">🖼️</span>
                          Images ({(npc as any).images.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {(npc as any).images.map((image: any, index: number) => (
                            <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-base-200">
                              <img 
                                src={`/api/images/npcs/${image.image_path?.split('/').pop() || 'placeholder.jpg'}`} 
                                alt={`NPC image ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                          {npc.tags.map((tag: string) => (
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
        }}
        searchTerm={crud.state.searchTerm}
        onSearchChange={crud.actions.setSearchTerm}
        emptyMessage="No NPCs found"
        loadingMessage="Loading NPCs..."
        errorMessage="Error loading NPCs"
      />

      {(crud.state.showCreateForm || crud.state.editingId) && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(crud.state.formData); }} className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl justify-center">{crud.state.editingId ? 'Edit NPC' : 'Create New NPC'}</h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="npc-name" className="block text-sm font-medium text-base-content mb-2">Name</label>
                <input
                  id="npc-name"
                  type="text"
                  placeholder="NPC Name"
                  value={crud.state.formData.name || ''}
                  onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, name: e.target.value })}
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
                  value={crud.state.formData.role || ''}
                  onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, role: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label htmlFor="npc-adventure" className="block text-sm font-medium text-base-content mb-2">Adventure</label>
                <select
                  id="npc-adventure"
                  value={crud.state.formData.adventure_id ?? (adv.selectedId ?? '')}
                  onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, adventure_id: e.target.value ? Number(e.target.value) : null })}
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
                  value={crud.state.formData.description || ''}
                  onChange={(e) => crud.actions.setFormData({ ...crud.state.formData, description: e.target.value })}
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
                  {(crud.state.formData.tags || []).map((tag: string) => (
                    <Chip key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
                  ))}
                </div>
              </div>


            </div>

            <div className="card-actions justify-end">
              <button
                type="button"
                onClick={crud.actions.handleCancel}
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
      )}
    </Page>
  );
}