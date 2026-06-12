export interface SearchableItem {
  id: string;
  name: string;
  description?: string | null;
}

/** 이름·보조 설명에 검색어가 포함된 항목만 반환한다 (영문 대소문자 무시). */
export function filterByQuery<T extends SearchableItem>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q),
  );
}
