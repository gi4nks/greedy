'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { EyeOff, Plus } from 'lucide-react';
import { createCampaign } from '@/lib/actions/campaigns';

export default function CreateCampaignForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(createCampaign, undefined);

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setIsOpen(true)}
      >
        New Campaign
      </button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create New Campaign</h3>
            <form action={formAction} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Campaign title"
                  className="input input-bordered"
                  required
                />
                {state?.errors?.title && (
                  <span className="text-error text-sm">{state.errors.title[0]}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Campaign description"
                  className="textarea textarea-bordered"
                  rows={3}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">World Name</span>
                </label>
                <input
                  type="text"
                  name="worldName"
                  placeholder="e.g., Forgotten Realms"
                  className="input input-bordered"
                />
              </div>

              <input type="hidden" name="tags" value="[]" />

              {state?.message && (
                <div className="alert alert-error">
                  {state.message}
                </div>
              )}

              <div className="modal-action">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <EyeOff className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}