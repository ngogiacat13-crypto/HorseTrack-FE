import { RefObject, useEffect, useRef } from 'react';

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
