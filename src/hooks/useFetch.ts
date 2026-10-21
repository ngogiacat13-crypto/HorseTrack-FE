import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

export function useFetch<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const lastDeps = useRef<DependencyList | null>(null);

  useEffect(() => {
    let cancelled = false;
    const changed = !lastDeps.current || deps.some((d, i) => d !== lastDeps.current?.[i]);
    lastDeps.current = deps;
    if (changed) setData(null);
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
