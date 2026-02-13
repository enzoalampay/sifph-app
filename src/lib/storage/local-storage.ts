const STORAGE_PREFIX = "sifph:v1:";

export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to write to localStorage:", e);
  }
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_PREFIX + key);
}

export function getIndex(entity: string): string[] {
  return getItem<string[]>(`${entity}:index`) ?? [];
}

export function addToIndex(entity: string, id: string): void {
  const index = getIndex(entity);
  if (!index.includes(id)) {
    index.push(id);
    setItem(`${entity}:index`, index);
  }
}

export function removeFromIndex(entity: string, id: string): void {
  const index = getIndex(entity);
  setItem(`${entity}:index`, index.filter((i) => i !== id));
}

// Entity-level CRUD helpers
export function saveEntity<T>(entity: string, id: string, data: T): void {
  setItem(`${entity}:${id}`, data);
  addToIndex(entity, id);
}

export function loadEntity<T>(entity: string, id: string): T | null {
  return getItem<T>(`${entity}:${id}`);
}

export function deleteEntity(entity: string, id: string): void {
  removeItem(`${entity}:${id}`);
  removeFromIndex(entity, id);
}

export function loadAllEntities<T>(entity: string): T[] {
  const index = getIndex(entity);
  return index
    .map((id) => loadEntity<T>(entity, id))
    .filter((item): item is T => item !== null);
}
