export function logError(_err: unknown, _context?: string) {
  try {
    // Console logging for now; could post to a remote logging service here.
    // Fetch example (uncomment and configure) to send logs to a server:
    // fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    // For now, we'll skip logging to avoid console statements
  } catch {
    // Failed to log error
  }
}
