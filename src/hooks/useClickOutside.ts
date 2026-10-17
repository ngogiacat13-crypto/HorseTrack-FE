import { RefObject, useEffect, useRef } from 'react';

/* Custom hook: call onOutside when the user clicks outside `ref` or presses Escape (menus, popovers).
   The latest callback is kept in a ref so the listeners are added once, not on every render. */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T>, onOutside: () => void, enabled = true) {
  const cb = useRef(onOutside);
  useEffect(() => { cb.current = onOutside; });

  useEffect(() => {
    if (!enabled) return undefined;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb.current(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cb.current(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [ref, enabled]);
}
