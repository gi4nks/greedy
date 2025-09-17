export function parseTags(s?: string): string[] {
  if (!s) return [];
  try { return JSON.parse(s); } catch (e) { return []; }
}

export function stringifyTags(arr?: string[]): string {
  return JSON.stringify(arr || []);
}
