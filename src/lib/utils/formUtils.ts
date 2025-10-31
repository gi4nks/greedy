"use client";

import { toast } from "sonner";
import { formatZodErrors } from "@/lib/validation";
import { type ZodSchema } from "zod";

/**
 * Common form validation and submission utilities
 */

/**
 * Validates form data using a Zod schema and returns formatted errors
 */
export function validateFormData<T>(
  schema: ZodSchema<T>,
  data: T
): { success: boolean; errors?: Record<string, string> } {
  const validationResult = schema.safeParse(data);

  if (!validationResult.success) {
    const fieldErrors = formatZodErrors(validationResult.error!);
    return { success: false, errors: fieldErrors };
  }

  return { success: true };
}

/**
 * Common form submission handler pattern
 */
export async function handleFormSubmission(
  action: (formData: FormData) => Promise<{ success: boolean; message?: string }>,
  formData: FormData,
  options: {
    successMessage: string;
    errorMessage: string;
    redirectPath?: string;
    router?: { push: (path: string) => void };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await action(formData);

    if (result.success) {
      toast.success(options.successMessage);
      if (options.redirectPath && options.router) {
        options.router.push(options.redirectPath);
      }
      return { success: true };
    } else {
      const errorMessage = result.message || options.errorMessage;
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Form submission error:", error);
    const errorMessage = error instanceof Error ? error.message : options.errorMessage;
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Common pattern for extracting and validating form data
 */
export function extractFormData<T extends Record<string, unknown>>(
  formData: FormData,
  fields: string[],
  transformers?: Partial<Record<string, (value: string) => unknown>>
): T {
  const result = {} as T;

  fields.forEach(field => {
    const value = formData.get(field) as string;

    if (transformers && transformers[field]) {
      result[field as keyof T] = transformers[field]!(value) as T[keyof T];
    } else {
      result[field as keyof T] = value as T[keyof T];
    }
  });

  return result;
}
