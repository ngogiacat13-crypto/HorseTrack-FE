import { useEffect } from 'react';

const APP = 'HorseTrack';

/* Custom hook: show the page name in the browser tab ("Đổi mật khẩu · HorseTrack").
   Cleanup puts the previous title back when the page unmounts. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (!title) return undefined;
    const prev = document.title;
    document.title = `${title} · ${APP}`;
    return () => { document.title = prev; };
  }, [title]);
}
