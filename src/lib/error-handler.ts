"use client";

import { toast } from "sonner";
import { showToast } from "@/lib/toast";

/**
 * Centralized error handling utility for consistent error management across the app
 */
export class ErrorHandler {
  /**
   * Handle API/form submission errors with appropriate user feedback
   */
  static handleSubmissionError(error: unknown, context?: string): void {
    console.error(`Error in ${context || 'operation'}:`, error);

    let message = "An unexpected error occurred. Please try again.";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'error' in error) {
      message = String((error as { error: unknown }).error);
    }

    showToast.error(message);
  }

  /**
   * Handle data fetching errors
   */
  static handleFetchError(error: unknown, operation: string): void {
    console.error(`Failed to ${operation}:`, error);

    const message = `Failed to ${operation}. Please check your connection and try again.`;
    showToast.error(message);
  }

  /**
   * Handle validation errors from forms
   */
  static handleValidationError(error: unknown): void {
    console.error("Validation error:", error);

    let message = "Please check your input and try again.";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    showToast.error("Validation Error", message);
  }

  /**
   * Handle server action errors with unified format
   */
  static handleServerActionError(result: { success: boolean; error?: string }, operation: string): boolean {
    if (!result.success && result.error) {
      console.error(`Server action failed for ${operation}:`, result.error);
      showToast.error(result.error);
      return true; // Error was handled
    }
    return false; // No error to handle
  }

  /**
   * Handle deletion errors
   */
  static handleDeletionError(error: unknown, itemType: string): void {
    console.error(`Failed to delete ${itemType}:`, error);
    showToast.error(`Failed to delete ${itemType}. Please try again.`);
  }

  /**
   * Handle save/update errors
   */
  static handleSaveError(error: unknown, itemType: string, isUpdate = false): void {
    console.error(`Failed to ${isUpdate ? 'update' : 'save'} ${itemType}:`, error);
    showToast.error(`Failed to ${isUpdate ? 'update' : 'save'} ${itemType}. Please try again.`);
  }

  /**
   * Show success messages
   */
  static showSuccess(message: string, description?: string): void {
    showToast.success(message, description);
  }

  /**
   * Show info messages
   */
  static showInfo(message: string, description?: string): void {
    showToast.info(message, description);
  }

  /**
   * Show warning messages
   */
  static showWarning(message: string, description?: string): void {
    showToast.warning(message, description);
  }

  /**
   * Legacy alert replacement - converts blocking alerts to toasts
   */
  static alert(message: string): void {
    showToast.error(message);
  }
}

/**
 * React hook for error handling in components
 */
export function useErrorHandler() {
  return {
    handleSubmissionError: ErrorHandler.handleSubmissionError,
    handleFetchError: ErrorHandler.handleFetchError,
    handleValidationError: ErrorHandler.handleValidationError,
    handleServerActionError: ErrorHandler.handleServerActionError,
    handleDeletionError: ErrorHandler.handleDeletionError,
    handleSaveError: ErrorHandler.handleSaveError,
    showSuccess: ErrorHandler.showSuccess,
    showInfo: ErrorHandler.showInfo,
    showWarning: ErrorHandler.showWarning,
    alert: ErrorHandler.alert,
  };
}