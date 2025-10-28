// Validation schemas for all entities
export * from "./character";
export * from "./quest";
export * from "./location";
export * from "./adventure";
export * from "./session";
export * from "./campaign";
export * from "./relationship";

// Common validation utilities
import { z } from "zod";

// Utility function to format Zod errors for forms
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return errors;
}

// Utility function to validate form data
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: formatZodErrors(result.error) };
  }
}