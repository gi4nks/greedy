// Use Vite's import.meta.env for frontend environment detection. Cast to any
// to avoid TypeScript complaining if Vite types aren't present in the project.
const isProd = ((import.meta as any)?.env?.MODE ?? 'development') === 'production';

export function logError(err: unknown, context?: string) {
  try {
    // In production we avoid spamming the browser console. In development
    // we print useful diagnostics to help debugging.
    if (!isProd) {
      // eslint-disable-next-line no-console
      console.error(context ? `${context}:` : 'Error:', err);
    }

    // TODO: Wire this to a remote logging service (Sentry, Logflare, etc.)
    // Example placeholder (commented):
    // fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ err, context }) });
  } catch {
    // Swallow logging errors to avoid throwing during error handling
  }
}

export function devLog(...args: unknown[]) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]) {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

export default { logError, devLog, devWarn };
