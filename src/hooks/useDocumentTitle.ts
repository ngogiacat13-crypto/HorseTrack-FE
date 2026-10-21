import { useEffect } from 'react';

const APP = 'HorseTrack';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (!title) return undefined;
    const prev = document.title;
    document.title = `${title} · ${APP}`;
    return () => { document.title = prev; };
  }, [title]);
}
