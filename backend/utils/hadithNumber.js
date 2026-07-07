function parseHadithNumberInt(value) {
  const parsed = parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => normalizeString(item))
    .filter(Boolean);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  parseHadithNumberInt,
  normalizeString,
  normalizeStringArray,
  escapeRegex
};
