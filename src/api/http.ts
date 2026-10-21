import axios from 'axios';
import { mockAdapter } from './mockServer';
import { hybridAdapter } from './hybridAdapter';
import { USE_BACKEND } from './beClient';

export const USE_MOCK = !import.meta.env.VITE_API_URL;
export const API_URL = import.meta.env.VITE_API_URL ?? 'mock://db.json';

export const http = axios.create({
  baseURL: USE_MOCK ? undefined : API_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCK ? { adapter: USE_BACKEND ? hybridAdapter : mockAdapter } : {}),
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      if (error instanceof Error && error.message && !error.message.includes('mock://')) {
        return Promise.reject(error);
      }
      return Promise.reject(new Error(`Không kết nối được máy chủ dữ liệu (${API_URL}). Hãy chạy "npm run server", hoặc bỏ VITE_API_URL để dùng dữ liệu mẫu trong trình duyệt.`));
    }
    const status = error.response.status;
    const msg = status === 404 ? 'Không tìm thấy dữ liệu.' : `Máy chủ trả về lỗi ${status}.`;
    return Promise.reject(new Error(msg));
  },
);

export type ApiError = { message?: string; field?: string; fields?: Record<string, string> };

const clock = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  return { date, time, short: `${date.slice(0, 5)} ${time}` };
};
export const DEMO_NOW = USE_BACKEND ? clock(new Date()) : { date: '03/10/2026', time: '10:31', short: '03/10 10:31' };
