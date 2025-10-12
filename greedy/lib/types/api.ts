// Common types for API responses and error handling

export type APIError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; errors: Record<string, string[]>; message?: string };

export type APIResponse<T = void> =
  | { success: true; data: T }
  | APIError;

// Logger utility for consistent logging across the application
export const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(message, error);
    }
    // TODO: Add production logging service (Sentry, etc.)
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
};