import axios from 'axios';

/* One axios instance for the whole app (Slot 18–19: REST + axios).
   The demo backend is json-server: `npm run server` serves db.json on port 9999. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9999';

export const http = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

/* Turn network / HTTP errors into one readable Vietnamese message. */
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error(`Không kết nối được máy chủ dữ liệu (${API_URL}). Hãy chạy "npm run server".`));
    }
    const status = error.response.status;
    const msg = status === 404 ? 'Không tìm thấy dữ liệu.' : `Máy chủ trả về lỗi ${status}.`;
    return Promise.reject(new Error(msg));
  },
);

/* Loi nem ra tu authApi: hoac Error (chi co message),
   hoac object { field, message } khi trung du lieu dang ky. */
export type ApiError = { message?: string; field?: string };

/* Demo clock used across the app (03/10/2026 10:30). */
export const DEMO_NOW = { date: '03/10/2026', time: '10:31', short: '03/10 10:31' };
