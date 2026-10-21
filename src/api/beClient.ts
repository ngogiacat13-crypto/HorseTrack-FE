import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

let onSessionExpired: () => void = () => {};
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const t = tokenStore.get();
  if (!t?.refreshToken) throw new Error('no refresh token');
  const { data } = await axios.post<ApiResponse<Tokens>>('/api/v1/auth/refresh', { refreshToken: t.refreshToken });
  tokenStore.set({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
  return data.data.accessToken;
}

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

export const EMAIL_TIMEOUT = 40000;

export const beData = <T>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);
