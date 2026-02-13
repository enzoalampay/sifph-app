export function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return true;

  // Direct contains
  if (normalizedText.includes(normalizedQuery)) return true;

  // Word-boundary match
  const words = normalizedQuery.split(/\s+/);
  return words.every((word) => normalizedText.includes(word));
}

export function searchFilter<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string
): T[] {
  if (!query.trim()) return items;
  return items.filter((item) => fuzzyMatch(getSearchText(item), query));
}
