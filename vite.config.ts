import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      // `npm run dev:be`: /api/v1/… is forwarded to the Spring Boot backend, so the browser has no CORS problem.
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          // The browser sees /api as same-origin; drop Origin so the backend's CORS list (only :5173) does not reject other dev ports with 403.
          configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
        },
      },
    },
  };
});
