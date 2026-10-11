import type { Middleware } from '@reduxjs/toolkit';

/* Logger middleware (Slot 16–17): runs after an action is dispatched and before it reaches the reducer,
   then prints the next state. Only active in development. */
export const logger: Middleware = (store) => (next) => (action) => {
  if (!import.meta.env.DEV) return next(action);
  const type = (action as { type?: string }).type ?? 'unknown';
  console.groupCollapsed(`%c[redux] ${type}`, 'color:#2d6a4f;font-weight:600');
  console.log('prev state', store.getState());
  console.log('action', action);
  const result = next(action);
  console.log('next state', store.getState());
  console.groupEnd();
  return result;
};
