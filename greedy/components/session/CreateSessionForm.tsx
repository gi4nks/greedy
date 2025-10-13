"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff } from "lucide-react";
import { createSession } from "@/lib/actions/sessions";
import { ActionResult } from "@/lib/types/api";
import type { Session } from "@/lib/db/schema";
import { toast } from "sonner";

export function CreateSessionForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        New Session
      </Button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Session</h3>

            <form
              action={async (formData: FormData) => {
                setIsSubmitting(true);
                try {
                  const result: ActionResult<Session> = await createSession(formData);

                  if (result?.success === false) {
                    toast.error(result.message || "Failed to create session.");
                  } else {
                    toast.success("Session created successfully!");
                    setIsOpen(false);
                  }
                } catch (error) {
                  console.error("Failed to create session:", error);
                  toast.error("Failed to create session. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Title *</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Session title"
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Date *</span>
                </label>
                <input
                  type="date"
                  name="date"
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Adventure ID</span>
                </label>
                <input
                  type="number"
                  name="adventureId"
                  placeholder="Optional adventure ID"
                  className="input input-bordered"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Session Notes</span>
                </label>
                <textarea
                  name="text"
                  placeholder="Session notes and summary"
                  className="textarea textarea-bordered"
                  rows={4}
                />
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Image Path</span>
                </label>
                <input
                  type="text"
                  name="imagePath"
                  placeholder="Optional image path"
                  className="input input-bordered"
                />
              </div>

              <div className="modal-action">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  <EyeOff className="w-4 h-4" />
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
