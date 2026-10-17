import React from 'react';
import { LoadState } from '../trainer/TrainerParts';

/* ---------- Async (render props) ----------
   Takes the result of useFetch and a function as children. While loading / on error it shows LoadState;
   once data is there it calls children(data), so inside the function `data` is never null.

   const state = useFetch(() => ownerApi.getPaymentHistory(actor), [actor]);
   return <Async state={state}>{(data) => <Page data={data} />}</Async>;

   Hooks cannot be called inside children(); put them above <Async> or in a child component. */
type FetchState<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void };

export function Async<T>({ state, children }: { state: FetchState<T>; children: (data: T) => React.ReactNode }) {
  if (state.data === null) return <LoadState loading={state.loading} error={state.error} onRetry={state.reload} />;
  return <>{children(state.data)}</>;
}
