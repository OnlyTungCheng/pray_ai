import { useEffect, useState } from 'react';

/**
 * A `useState` drop-in that persists its value to `localStorage`.
 *
 * The initial value is read synchronously on mount (via a lazy initializer),
 * and every subsequent update is written back to `localStorage` automatically.
 * Read/write errors (e.g. storage disabled, quota exceeded, invalid JSON)
 * are swallowed so the app keeps working without persistence.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved) as T;
    } catch (e) {
      // ignore malformed/inaccessible storage
    }
    return defaultValue instanceof Function ? defaultValue() : defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignore storage write failures (quota, disabled, etc.)
    }
  }, [key, value]);

  return [value, setValue];
}
