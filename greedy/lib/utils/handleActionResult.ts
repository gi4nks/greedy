import { ActionResult } from "@/lib/types/api";
import { showToast } from "@/lib/toast";

/**
 * Helper function to handle ActionResult responses on the client side
 * Displays appropriate toast notifications and returns the result
 */
export function handleActionResult<T>(
  result: ActionResult<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
  },
): { success: boolean; data?: T } {
  if (result.success) {
    if (options?.successMessage) {
      showToast.success(options.successMessage);
    }
    return { success: true, data: result.data };
  } else {
    // Handle validation errors
    if (result.errors) {
      const errorMessages = Object.values(result.errors).flat();
      showToast.error(
        options?.errorMessage || "Validation failed",
        errorMessages.join(", "),
      );
    } else if (result.message) {
      showToast.error(options?.errorMessage || result.message);
    } else {
      showToast.error(options?.errorMessage || "An error occurred");
    }
    return { success: false };
  }
}

/**
 * Helper function to extract error messages from ActionResult for form validation
 */
export function getActionResultErrors(
  result: ActionResult,
): Record<string, string[]> | null {
  if (result.success) {
    return null;
  }
  return result.errors || {};
}

/**
 * Helper function to check if ActionResult indicates success
 */
export function isActionResultSuccess<T>(
  result: ActionResult<T>,
): result is { success: true; data?: T } {
  return result.success;
}

/**
 * Helper function to check if ActionResult indicates failure
 */
export function isActionResultFailure<T>(
  result: ActionResult<T>,
): result is {
  success: false;
  errors?: Record<string, string[]>;
  message?: string;
} {
  return !result.success;
}
