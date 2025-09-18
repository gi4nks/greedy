export function logError(err: any, context?: string) {
  try {
    const payload = { message: err?.message || String(err), stack: err?.stack || null, context };
    // Console logging for now; could post to a remote logging service here.
    // Fetch example (uncomment and configure) to send logs to a server:
    // fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.error('[AppError]', payload);
  } catch (e) {
    console.error('Failed to log error', e);
  }
}
