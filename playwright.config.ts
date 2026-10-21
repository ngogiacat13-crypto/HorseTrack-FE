import { defineConfig } from '@playwright/test';

const PORT = 5199;
const onCi = !!process.env.CI;

export default defineConfig({
  testDir: './scenarios',
  timeout: 30_000,
  fullyParallel: true,
  workers: onCi ? 2 : undefined,
  retries: onCi ? 1 : 0,
  reporter: onCi ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !onCi,
    timeout: 60_000,
  },
});
