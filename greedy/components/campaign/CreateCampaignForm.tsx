"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Plus } from "lucide-react";
import { createCampaign } from "@/lib/actions/campaigns";
import { ActionResult } from "@/lib/types/api";
import { toast } from "sonner";

export default function CreateCampaignForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const result: ActionResult<{ id: number }> = await createCampaign(
        undefined,
        formData,
      );

      if (result?.success === false) {
        if (result.errors) {
          setErrors(result.errors);
          toast.error(
            "Failed to create campaign. Please check the form for errors.",
          );
        } else {
          toast.error(result.message || "Failed to create campaign.");
        }
      } else {
        toast.success("Campaign created successfully!");
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        New Campaign
      </Button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create New Campaign</h3>
            <form action={handleSubmit} className="space-y-4">
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
                {errors?.title && (
                  <span className="text-error text-sm">{errors.title[0]}</span>
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
                <Button
                  type="submit"
                  variant="primary"
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
