import axios from 'axios';
import { mockAdapter } from './mockServer';

/* One axios instance for the whole app (Slot 18–19: REST + axios).
   - No VITE_API_URL  → data comes from db.json inside the browser (src/api/mockServer.ts). `npm run dev` is enough.
   - VITE_API_URL set → real HTTP calls, e.g. json-server: `npm run server` + VITE_API_URL=http://localhost:9999. */
export const USE_MOCK = !import.meta.env.VITE_API_URL;
export const API_URL = import.meta.env.VITE_API_URL ?? 'mock://db.json';

export const http = axios.create({
  baseURL: USE_MOCK ? undefined : API_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
});

/* Turn network / HTTP errors into one readable Vietnamese message. */
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error(`Không kết nối được máy chủ dữ liệu (${API_URL}). Hãy chạy "npm run server", hoặc bỏ VITE_API_URL để dùng dữ liệu mẫu trong trình duyệt.`));
    }
    const status = error.response.status;
    const msg = status === 404 ? 'Không tìm thấy dữ liệu.' : `Máy chủ trả về lỗi ${status}.`;
    return Promise.reject(new Error(msg));
  },
);

/* Lỗi ném ra từ authApi: lỗi đơn, hoặc nhiều lỗi theo từng field khi đăng ký. */
export type ApiError = { message?: string; field?: string; fields?: Record<string, string> };

/* Demo clock used across the app (03/10/2026 10:30). */
export const DEMO_NOW = { date: '03/10/2026', time: '10:31', short: '03/10 10:31' };
