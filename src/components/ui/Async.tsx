import React from 'react';
import { LoadState } from '../trainer/TrainerParts';

type FetchState<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void };

export function Async<T>({ state, children }: { state: FetchState<T>; children: (data: T) => React.ReactNode }) {
  if (state.data === null) return <LoadState loading={state.loading} error={state.error} onRetry={state.reload} />;
  return <>{children(state.data)}</>;
}
