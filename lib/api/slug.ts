export function normalizeSlugSegment(value: string) {
  return value.trim().toLowerCase();
}

export function isValidSlugSegment(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}
