import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/* Axios instance for the real Spring Boot backend (HorseTrack / EquineCare API).
   - Turned on with `npm run dev:be` (vite --mode backend → .env.backend sets VITE_BACKEND=1).
   - Calls go to /api/v1/… on the Vite dev server, which proxies them to the backend (default http://localhost:8080),
     so the browser never hits CORS.
   - Every backend response is wrapped as { success, message, data, timestamp } (ApiResponse.java); `beData` unwraps it.
   - Login gives an accessToken (15 min) + refreshToken (7 days). The access token is sent as "Authorization: Bearer …";
     on a 401 the client refreshes once and repeats the request. */
export const USE_BACKEND = import.meta.env.VITE_BACKEND === '1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = 'horsetrack_tokens';

export const tokenStore = {
  get(): Tokens | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  },
  set(t: Tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const be = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

be.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t?.accessToken && !config.headers.Authorization) config.headers.Authorization = `Bearer ${t.accessToken}`;
  return config;
});

/* Called when even the refresh fails: the session is over (AuthContext signs the user out). */
let onSessionExpired: () => void = () => {};
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const t = tokenStore.get();
  if (!t?.refreshToken) throw new Error('no refresh token');
  // plain axios: this call must not go through the 401 interceptor again
  const { data } = await axios.post<ApiResponse<Tokens>>('/api/v1/auth/refresh', { refreshToken: t.refreshToken });
  tokenStore.set({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
  return data.data.accessToken;
}

/* Turn a backend error into one readable message (validation errors come back as { field: message }). */
function toError(error: AxiosError<ApiResponse<unknown>>): Error {
  if (!error.response) {
    return new Error('Không kết nối được máy chủ backend. Hãy chạy ứng dụng Spring Boot (cổng 8080) rồi thử lại.');
  }
  const body = error.response.data;
  if (body && typeof body === 'object') {
    if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      const fields = Object.values(body.data as Record<string, string>).filter((v) => typeof v === 'string');
      if (fields.length) return new Error(fields.join(' · '));
    }
    if (body.message) return new Error(body.message);
  }
  const status = error.response.status;
  if (status === 401) return new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  if (status === 403) return new Error('Bạn không có quyền thực hiện thao tác này.');
  return new Error(`Máy chủ trả về lỗi ${status}.`);
}

be.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const req = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    // public auth calls never retry; /auth/staff/create needs a token like any other call
    const isAuthCall = /^\/auth\/(login|refresh|logout|register-owner)/.test(req?.url ?? '');
    if (error.response?.status === 401 && req && !req._retried && !isAuthCall && tokenStore.get()?.refreshToken) {
      req._retried = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const token = await refreshing;
        req.headers.Authorization = `Bearer ${token}`;
        return be(req);
      } catch {
        tokenStore.clear();
        onSessionExpired();
      }
    }
    return Promise.reject(toError(error));
  },
);

/** Calls that send an email: the backend may wait for SMTP (app.mail.wait-seconds), so allow more than the default 15 s. */
export const EMAIL_TIMEOUT = 40000;

/** Unwrap ApiResponse<T> → T. */
export const beData = <T>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);
