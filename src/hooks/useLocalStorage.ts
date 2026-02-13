"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getItem,
  setItem,
  saveEntity,
  loadEntity,
  deleteEntity,
  loadAllEntities,
  getIndex,
} from "@/lib/storage/local-storage";

// Generic hook for a single localStorage value
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = getItem<T>(key);
    return item ?? initialValue;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        setItem(key, newValue);
        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

// Hook for managing a collection of entities in localStorage
export function useEntityStorage<T extends { id: string }>(entity: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load all entities on mount
  useEffect(() => {
    const all = loadAllEntities<T>(entity);
    setItems(all);
    setLoaded(true);
  }, [entity]);

  const save = useCallback(
    (item: T) => {
      saveEntity(entity, item.id, item);
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = item;
          return updated;
        }
        return [...prev, item];
      });
    },
    [entity]
  );

  const remove = useCallback(
    (id: string) => {
      deleteEntity(entity, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [entity]
  );

  const load = useCallback(
    (id: string): T | null => {
      return loadEntity<T>(entity, id);
    },
    [entity]
  );

  const refresh = useCallback(() => {
    const all = loadAllEntities<T>(entity);
    setItems(all);
  }, [entity]);

  return { items, save, remove, load, refresh, loaded };
}
