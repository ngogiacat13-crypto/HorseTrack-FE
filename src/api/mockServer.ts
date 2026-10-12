import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import seed from '../../db.json';

/* In-browser mock backend: an axios adapter that answers REST calls from db.json,
   the same way json-server 0.17 does (filters, _sort, _order, _limit, GET/POST/PATCH/PUT/DELETE).
   Used when VITE_API_URL is not set, so the UI can be tested with `npm run dev` only.
   Changes are kept in localStorage; call resetMockDb() (or clear site data) to start over. */

type Row = Record<string, unknown>;
type Db = Record<string, Row[] | Row>;

const STORAGE_KEY = 'horsetrack_mockdb_v9';
const LATENCY_MS = 150;

const load = (): Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return JSON.parse(JSON.stringify(seed)) as Db;
};

let db: Db = load();
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
};

/** Restore db.json's original data. */
export const resetMockDb = () => {
  localStorage.removeItem(STORAGE_KEY);
  db = load();
};

const respond = (config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse => ({
  data, status, statusText: String(status), headers: new AxiosHeaders(), config, request: {},
});

const fail = (config: InternalAxiosRequestConfig, status: number): never => {
  throw new AxiosError(`Mock ${status}`, String(status), config, {}, respond(config, status, {}));
};

const RESERVED = new Set(['_sort', '_order', '_limit', '_page', 'q']);

export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  const method = (config.method ?? 'get').toLowerCase();
  const url = new URL(config.url ?? '/', 'http://mock.local');
  const [name, id] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const params: Record<string, unknown> = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  const body = typeof config.data === 'string' && config.data ? (JSON.parse(config.data) as Row) : ((config.data as Row) ?? {});

  if (!name || !(name in db)) return fail(config, 404);
  const resource = db[name];

  // Singular resource (e.g. /dashboard, /financeReport)
  if (!Array.isArray(resource)) {
    if (method === 'get') return respond(config, 200, resource);
    if (method === 'patch' || method === 'put') {
      db[name] = method === 'put' ? body : { ...resource, ...body };
      save();
      return respond(config, 200, db[name]);
    }
    return fail(config, 404);
  }

  const index = id === undefined ? -1 : resource.findIndex((r) => String(r.id) === id);

  if (method === 'get') {
    if (id !== undefined) return index < 0 ? fail(config, 404) : respond(config, 200, resource[index]);
    let rows = resource.filter((r) =>
      Object.entries(params).every(([k, v]) => RESERVED.has(k) || v === undefined || String(r[k]) === String(v)));
    if (params._sort) {
      const key = String(params._sort);
      const dir = String(params._order ?? 'asc').toLowerCase() === 'desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const x = a[key] as string | number, y = b[key] as string | number;
        return (x > y ? 1 : x < y ? -1 : 0) * dir;
      });
    }
    if (params._limit) rows = rows.slice(0, Number(params._limit));
    return respond(config, 200, rows);
  }

  if (method === 'post') {
    const row = { ...body, id: body.id ?? `${Date.now()}` };
    if (resource.some((r) => String(r.id) === String(row.id))) return fail(config, 500);
    resource.push(row);
    save();
    return respond(config, 201, row);
  }

  if (index < 0) return fail(config, 404);

  if (method === 'patch' || method === 'put') {
    resource[index] = method === 'put' ? { ...body, id: resource[index].id } : { ...resource[index], ...body };
    save();
    return respond(config, 200, resource[index]);
  }

  if (method === 'delete') {
    resource.splice(index, 1);
    save();
    return respond(config, 200, {});
  }

  return fail(config, 405);
};
