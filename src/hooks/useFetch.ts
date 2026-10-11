import { DependencyList, useCallback, useEffect, useState } from 'react';

/* Custom hook (Slot 9–10, 19): run an async loader in useEffect and expose { data, loading, error, reload }.
   The cleanup flag ignores a response that arrives after the component unmounted or the deps changed. */
export function useFetch<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [...deps, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
