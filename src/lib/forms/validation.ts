import { z } from "zod";

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================
// Utilities for form validation and error handling

/**
 * Format Zod errors for form display
 */
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

/**
 * Validate form data with a schema
 */
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

/**
 * Validate form data and return unified response for API routes
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
):
  | { success: true; data: T }
  | { success: false; error: string; data?: unknown } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`,
    );
    return {
      success: false,
      error: "Invalid request data",
      data: errorMessages,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Create validation error response
 */
export function createValidationError(message: string, details?: unknown) {
  return {
    success: false,
    error: message,
    data: details,
  };
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Email validation
  email: z.string().email("Invalid email address"),

  // URL validation
  url: z.string().url("Invalid URL"),

  // Date validation (YYYY-MM-DD)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  // Positive integer
  positiveInt: z.number().int().positive("Must be a positive integer"),

  // Non-empty string
  requiredString: (fieldName: string) =>
    z.string().min(1, `${fieldName} is required`),

  // Optional string with max length
  optionalString: (maxLength: number, fieldName: string) =>
    z.string().max(maxLength, `${fieldName} must be less than ${maxLength} characters`).optional().or(z.literal("")),

  // Array of strings (tags, etc.)
  stringArray: z.union([
    z.string(),
    z.array(z.string())
  ]).transform((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }).optional(),
} as const;