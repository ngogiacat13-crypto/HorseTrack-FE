import { useEffect, useState } from 'react';

/* Custom hook: return `value` only after it stopped changing for `delay` ms.
   Used by search boxes so the list is filtered once the user pauses typing, not on every key.
   The cleanup clears the previous timer each time value changes (same idea as the auto-hide alert). */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
