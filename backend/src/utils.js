function parseTags(s) {
  if (!s) return [];
  try { return JSON.parse(s); } catch (e) { return []; }
}

function stringifyTags(arr) {
  return JSON.stringify(arr || []);
}

module.exports = { parseTags, stringifyTags };
