/**
 * Centralized logging utility for the application.
 *
 * In development: Logs to console
 * In production: Placeholder for external logging services (Sentry, etc.)
 *
 * TODO: Wire up Sentry or other production logging service
 * Example:
 * import * as Sentry from '@sentry/nextjs';
 *
 * export const logger = {
 *   info: (...args: unknown[]) => {
 *     if (process.env.NODE_ENV === 'development') console.log(...args);
 *     // Sentry.captureMessage(args.join(' '), 'info');
 *   },
 *   warn: (...args: unknown[]) => {
 *     if (process.env.NODE_ENV === 'development') console.warn(...args);
 *     // Sentry.captureMessage(args.join(' '), 'warning');
 *   },
 *   error: (msg: string, err?: unknown) => {
 *     if (process.env.NODE_ENV === 'development') console.error(msg, err);
 *     Sentry.captureException(err || new Error(msg));
 *   },
 * };
 */

export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.warn(...args);
  },
  error: (msg: string, err?: unknown) => {
    if (process.env.NODE_ENV === "development") console.error(msg, err);
    // TODO: Add Sentry or other production logging service
    // Example: Sentry.captureException(err || new Error(msg));
  },
};
