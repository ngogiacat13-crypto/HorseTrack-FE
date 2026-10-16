import { useCallback, useState } from 'react';

/* Custom hook: like useState, but the value survives F5 (saved in localStorage under `key`).
   Reading/writing is wrapped in try/catch: storage can be full or blocked (private window). */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback((next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* the value still applies until reload */
    }
  }, [key]);

  return [value, set] as const;
}
