"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTagManagement } from "@/lib/utils/tagUtils";
import { useImageManagement, imageUtils } from "@/lib/utils/imageFormUtils";
import { useWikiItemManagement } from "@/lib/utils/wikiUtils";
import { WikiEntity } from "@/lib/types/wiki";
import { ErrorHandler } from "@/lib/error-handler";

/**
 * Unified form state management hook that combines common form patterns
 */
export function useEntityForm({
  mode,
  entity,
  campaignId,
  redirectPath,
  initialTags = [],
  initialImages = [],
  initialWikiEntities = [],
}: {
  mode: "create" | "edit";
  entity?: { id?: number };
  campaignId?: number;
  redirectPath: string;
  initialTags?: string[];
  initialImages?: unknown[];
  initialWikiEntities?: WikiEntity[];
}) {
  const router = useRouter();

  // Combined state management
  const tagManagement = useTagManagement(initialTags);
  const imageManagement = useImageManagement(imageUtils.parseImages(initialImages));
  const wikiManagement = useWikiItemManagement(initialWikiEntities);

  // Form submission state
  const [isPending, setIsPending] = useState(false);

  // Handle form submission with consistent error handling
  const handleSubmit = async (
    action: (formData: FormData) => Promise<{ success: boolean; error?: string }>,
    formData: FormData,
    successMessage: string
  ) => {
    setIsPending(true);

    try {
      // Add common form data
      formData.append("tags", tagManagement.tags.join(","));
      formData.append("images", JSON.stringify(imageManagement.images));

      const result = await action(formData);

      if (result.success) {
        ErrorHandler.showSuccess(successMessage);
        router.push(redirectPath);
      } else {
        ErrorHandler.handleSubmissionError(result.error, `${mode} operation`);
      }
    } catch (error) {
      ErrorHandler.handleSubmissionError(error, `${mode} operation`);
    } finally {
      setIsPending(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    router.back();
  };

  return {
    // State
    isPending,
    mode,
    entityId: entity?.id,

    // Sub-hooks
    tagManagement,
    imageManagement,
    wikiManagement,

    // Actions
    handleSubmit,
    handleCancel,

    // Utilities
    canEditImages: () => imageUtils.canEditImages(mode, entity?.id),
  };
}

/**
 * Hook for server action integration with consistent error handling
 */
export function useServerAction({
  onSuccess,
  onError,
}: {
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
} = {}) {
  const [state, setState] = useState<{ success: boolean; error?: string }>({ success: false });
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess(state);
    } else if (state.error && onError) {
      onError(state.error);
    }
  }, [state, onSuccess, onError]);

  const executeAction = async (
    action: (formData: FormData) => Promise<{ success: boolean; error?: string }>,
    formData: FormData
  ) => {
    setIsPending(true);
    try {
      const result = await action(formData);
      setState(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      };
      setState(errorResult);
      return errorResult;
    } finally {
      setIsPending(false);
    }
  };

  return {
    state,
    isPending,
    executeAction,
  };
}

/**
 * Common status options used across forms
 */
export const COMMON_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

export const QUEST_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "paused", label: "Paused" },
];

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
];