// Common types for API responses and error handling

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; errors?: Record<string, string[]>; message?: string };

export type APIError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
